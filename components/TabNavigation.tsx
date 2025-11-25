'use client';

import React from 'react';

export type TabId = 'mint' | 'leaderboard' | 'howitworks';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  username?: string;
}

export default function TabNavigation({ activeTab, onTabChange, username }: TabNavigationProps) {
  const tabs: Tab[] = [
    { id: 'mint', label: 'Mint', icon: '💩' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'howitworks', label: username || 'Profile', icon: '👤' }
  ];

  return (
    <div className="fc-tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`fc-tab ${activeTab === tab.id ? 'fc-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="fc-tab-icon">{tab.icon}</span>
          <span className="fc-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
