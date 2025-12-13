import React from 'react';
import { useSync } from '../context/SyncContext';

const SyncStatus = () => {
  const { online, syncStatus, lastSync, syncNow } = useSync();

  const getStatusColor = () => {
    if (!online) return 'text-red-600 bg-red-100';
    if (syncStatus === 'syncing') return 'text-yellow-600 bg-yellow-100';
    if (syncStatus === 'error') return 'text-red-600 bg-red-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusText = () => {
    if (!online) return 'OFFLINE';
    if (syncStatus === 'syncing') return 'SYNCING...';
    if (syncStatus === 'error') return 'SYNC ERROR';
    return 'ONLINE';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`px-2 py-1 rounded-full ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {lastSync && (
        <span className="text-gray-500">
          Last sync: {new Date(lastSync).toLocaleTimeString()}
        </span>
      )}
      {online && syncStatus !== 'syncing' && (
        <button 
          onClick={syncNow}
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Sync Now
        </button>
      )}
    </div>
  );
};

export default SyncStatus;