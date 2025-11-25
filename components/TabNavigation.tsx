'use client';

import React from 'react';

export type TabId = 'mint' | 'leaderboard' | 'howitworks';

interface Tab {
  id: TabId;
  label: string;
  icon?: string;
  iconType?: 'emoji' | 'image' | 'pfp';
  iconSrc?: string;
}

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  username?: string;
  pfpUrl?: string;
}

export default function TabNavigation({ activeTab, onTabChange, username, pfpUrl }: TabNavigationProps) {
  const tabs: Tab[] = [
    { id: 'mint', label: 'Mint', iconType: 'image', iconSrc: '/splash.png' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', iconType: 'emoji' },
    { id: 'howitworks', label: username || 'Profile', iconType: 'pfp', iconSrc: pfpUrl }
  ];

  return (
    <div className="fc-tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`fc-tab ${activeTab === tab.id ? 'fc-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="fc-tab-icon">
            {tab.iconType === 'emoji' && tab.icon}
            {tab.iconType === 'image' && tab.iconSrc && (
              <img
                src={tab.iconSrc}
                alt={tab.label}
                style={{
                  width: '1.2em',
                  height: '1.2em',
                  display: 'inline-block',
                  verticalAlign: 'middle'
                }}
              />
            )}
            {tab.iconType === 'pfp' && tab.iconSrc && (
              <img
                src={tab.iconSrc}
                alt={tab.label}
                style={{
                  width: '1.5em',
                  height: '1.5em',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'inline-block',
                  verticalAlign: 'middle'
                }}
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.textContent = '👤';
                  }
                }}
              />
            )}
            {tab.iconType === 'pfp' && !tab.iconSrc && '👤'}
          </span>
          <span className="fc-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
