import React from 'react';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  userName: string;
  userAvatar: string;
  notificationCount?: number;
  onCreateEvent: () => void;
  onNotifications: () => void;
}

export function DashboardHeader({
  userName,
  userAvatar,
  notificationCount = 0,
  onCreateEvent,
  onNotifications,
}: DashboardHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-white">🎉</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">ReUNE</h1>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">Seu dashboard</p>
            </div>
            <img
              src={userAvatar}
              alt={userName}
              className="w-10 h-10 rounded-full border-2 border-orange-200"
            />
          </div>

          {/* Notifications button */}
          <button
            onClick={onNotifications}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Create event button */}
          <Button
            onClick={onCreateEvent}
            className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Criar Novo Role</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
