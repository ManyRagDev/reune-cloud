import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onLogout: () => void;
}

export default function AdminHeader({ title, subtitle, onLogout }: AdminHeaderProps) {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-7xl px-4"
    >
      <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-purple-500 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-purple-500 bg-clip-text text-transparent">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="gap-2 hover:bg-background/80"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
