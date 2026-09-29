import React from 'react';
import { TopNav } from '../components/ui/TopNav';
import { LeftPanel } from '../components/ui/LeftPanel';
import { RightPanel } from '../components/ui/RightPanel';
import { SubsurfaceVoxelMap } from '../components/ui/SubsurfaceVoxelMap';
import { AiAssistantSidebar } from '../components/ui/AiAssistantSidebar';
import { useDashboardStore } from '../store/useDashboardStore';

export const Dashboard: React.FC = () => {
  const { isAiOpen, toggleAi } = useDashboardStore();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <TopNav />
      <main className="flex-1 relative w-full h-full">
        <LeftPanel />
        <SubsurfaceVoxelMap /> {/* WebGL Map Component */}
        <RightPanel />
        <AiAssistantSidebar 
          isOpen={isAiOpen} 
          onClose={toggleAi} 
          currentTab="exploration" 
        />
      </main>
    </div>
  );
};
