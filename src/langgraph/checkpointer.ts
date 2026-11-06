import { BaseCheckpointSaver, type Checkpoint, type CheckpointMetadata, type CheckpointTuple, type ChannelVersions, type PendingWrite } from '@langchain/langgraph-checkpoint';
import type { RunnableConfig } from '@langchain/core/runnables';
import { supabase } from '@/integrations/supabase/client';

const TABLE = 'langgraph_checkpoints';

interface StoredCheckpoint {
  thread_id: string;
  checkpoint: Checkpoint;
  metadata: CheckpointMetadata;
  parent_config?: RunnableConfig;
  created_at: string;
}

export class SupabaseCheckpointer extends BaseCheckpointSaver {
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) return undefined;

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return undefined;

    const stored = data as StoredCheckpoint;
    return {
      config: {
        configurable: {
          thread_id: threadId,
          checkpoint_id: stored.checkpoint.id,
        },
      },
      checkpoint: stored.checkpoint,
      metadata: stored.metadata,
      parentConfig: stored.parent_config,
    };
  }

  async *list(config: RunnableConfig): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) return;

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false });

    if (error || !data) return;

    for (const row of data) {
      const stored = row as StoredCheckpoint;
      yield {
        config: {
          configurable: {
            thread_id: threadId,
            checkpoint_id: stored.checkpoint.id,
          },
        },
        checkpoint: stored.checkpoint,
        metadata: stored.metadata,
        parentConfig: stored.parent_config,
      };
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) {
      throw new Error('thread_id is required in config.configurable');
    }

    const parentConfig = config.configurable?.checkpoint_id
      ? config
      : undefined;

    const record: Omit<StoredCheckpoint, 'created_at'> = {
      thread_id: threadId,
      checkpoint,
      metadata: {
        ...metadata,
        thread_id: threadId,
        user_id: metadata?.user_id || threadId,
      },
      parent_config: parentConfig,
    };

    const { error } = await supabase
      .from(TABLE)
      .upsert(record, { onConflict: 'thread_id' });

    if (error) {
      console.error('[SupabaseCheckpointer] Error saving checkpoint:', error);
      throw new Error(`Failed to save checkpoint: ${error.message}`);
    }

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_id: checkpoint.id,
      },
    };
  }

  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) return;

    const { data: existing } = await supabase
      .from(TABLE)
      .select('metadata')
      .eq('thread_id', threadId)
      .maybeSingle();

    const currentMeta = (existing as { metadata?: CheckpointMetadata })?.metadata || {};

    const { error } = await supabase
      .from(TABLE)
      .update({
        metadata: {
          ...currentMeta,
          pending_writes: writes,
          last_task_id: taskId,
        },
      })
      .eq('thread_id', threadId);

    if (error) {
      console.error('[SupabaseCheckpointer] Error saving writes:', error);
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('thread_id', threadId);

    if (error) {
      console.error('[SupabaseCheckpointer] Error deleting thread:', error);
    }
  }

  getNextVersion(current: number | undefined): number {
    return (current ?? 0) + 1;
  }
}
