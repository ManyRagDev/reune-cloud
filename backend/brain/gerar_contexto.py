import os

# --- CONFIGURAÇÕES ---

# Nome do arquivo final que será gerado
OUTPUT_FILE = 'PROJETO_COMPLETO.txt'

# Pastas para IGNORAR (não entra nelas para ganhar tempo e não pegar lixo)
IGNORE_DIRS = {
    'node_modules', 
    '.git', 
    'dist', 
    'build', 
    '.vscode', 
    '.idea', 
    '__pycache__', 
    'coverage', 
    'supabase' # Ignoramos a pasta do supabase pois o Claude já está cuidando do SQL
}

# Arquivos específicos para IGNORAR (não lê o conteúdo)
IGNORE_FILES = {
    'package-lock.json', 
    'yarn.lock', 
    'pnpm-lock.yaml', 
    'gerar_contexto.py', # Ignora o próprio script
    OUTPUT_FILE,         # Ignora o arquivo de saída
    '.DS_Store', 
    '.env',              # SEGURANÇA: Ignora arquivos de ambiente com senhas
    '.env.local',
    '.env.development',
    '.env.production',
    'README.md', 
    'DOCUMENTACAO_COMPLETA_REUNE.md'
}

# Extensões permitidas (FOCADO NO CORE DA APLICAÇÃO)
ALLOWED_EXTENSIONS = {
    # Lógica e Componentes
    '.js', '.jsx', 
    '.ts', '.tsx',
    
    # Estilos
    '.css', '.scss', '.sass', 
    
    # Configurações importantes
    '.json',  # Útil para ver package.json, tsconfig.json
    '.toml',  # Útil para vite.config.ts se estiver em toml ou outros
    
    # Backend scripts (se houver algum python perdido na pasta src)
    '.py'
    
    # NOTA: .sql foi removido intencionalmente.
}

def is_text_file(filename):
    """Verifica se a extensão do arquivo está na lista de permitidas."""
    _, ext = os.path.splitext(filename)
    return ext in ALLOWED_EXTENSIONS

def main():
    print(f"🚀 Iniciando varredura do projeto...")
    
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
            outfile.write(f"# CONTEXTO DO PROJETO REUNE (FRONTEND/CORE)\n")
            outfile.write(f"# Gerado automaticamente para análise de IA\n\n")

            total_files = 0

            # Caminha pela árvore de diretórios
            for root, dirs, files in os.walk('.'):
                # Modifica a lista 'dirs' in-place para pular pastas ignoradas
                # Isso impede que o script perca tempo entrando em node_modules
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

                for file in files:
                    if file in IGNORE_FILES:
                        continue
                    
                    if not is_text_file(file):
                        continue

                    file_path = os.path.join(root, file)
                    total_files += 1
                    
                    # Cria um cabeçalho visual para separar os arquivos
                    outfile.write(f"\n{'='*60}\n")
                    outfile.write(f"FILE PATH: {file_path}\n")
                    outfile.write(f"{'='*60}\n")

                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                            outfile.write(content + "\n")
                    except Exception as e:
                        outfile.write(f"[ERRO AO LER ESTE ARQUIVO: {e}]\n")

        print(f"✅ Sucesso! Arquivo '{OUTPUT_FILE}' gerado na raiz.")
        print(f"📂 Total de arquivos processados: {total_files}")
        print(f"📄 Tamanho do arquivo gerado: {os.path.getsize(OUTPUT_FILE) / 1024:.2f} KB")
        print("👉 Agora anexe este arquivo no chat.")

    except Exception as e:
        print(f"❌ Erro fatal ao rodar o script: {e}")

if __name__ == '__main__':
    main()