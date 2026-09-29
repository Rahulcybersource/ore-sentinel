import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Header, MainTab } from '../components/workspaces/Header';
import { LandingPage } from '../components/workspaces/LandingPage';
import { OverviewDashboard } from '../components/workspaces/OverviewDashboard';
import { ExplorationWorkspace } from '../components/workspaces/ExplorationWorkspace';
import { ResourceWorkspace } from '../components/workspaces/ResourceWorkspace';
import { ProductionWorkspace } from '../components/workspaces/ProductionWorkspace';
import { ScenarioWorkspace } from '../components/workspaces/ScenarioWorkspace';
import { ActionsWorkspace } from '../components/workspaces/ActionsWorkspace';
import { DataSourcesView } from '../components/workspaces/DataSourcesView';
import { ModelCenterView } from '../components/workspaces/ModelCenterView';
import { SystemArchitectureView } from '../components/workspaces/SystemArchitectureView';
import { SihMatrixView } from '../components/workspaces/SihMatrixView';
import { AboutProblemModal } from '../components/workspaces/AboutProblemModal';
import { AiAssistantSidebar } from '../components/ui/AiAssistantSidebar';
import { EXPLORATION_TARGETS, DRILLHOLES } from '../data/explorationData';
import { ExplorationTarget, WorkflowStep } from '../types';

export function Intelligence() {
  const [activeTab, setActiveTab] = useState<MainTab>('landing');
  const [selectedTarget, setSelectedTarget] = useState<ExplorationTarget>(EXPLORATION_TARGETS[0]);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // Keyboard shortcut (Cmd+K or Ctrl+K) to toggle AI Assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAiAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Workflow mapping helper
  const handleWorkflowNavigation = (step: WorkflowStep) => {
    switch (step) {
      case 'explore':
        setActiveTab('exploration');
        break;
      case 'estimate':
        setActiveTab('resource');
        break;
      case 'predict':
        setActiveTab('production');
        break;
      case 'simulate':
        setActiveTab('scenarios');
        break;
      case 'act':
        setActiveTab('actions');
        break;
    }
  };

  const handleSelectTargetAndEstimate = (targetId: string) => {
    const target = EXPLORATION_TARGETS.find((t) => t.id === targetId) || EXPLORATION_TARGETS[0];
    setSelectedTarget(target);
    setActiveTab('resource');
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-stone-900">
      {/* Persistent Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenLanding={() => setActiveTab('landing')}
        isAiAssistantOpen={isAiAssistantOpen}
        onToggleAiAssistant={() => setIsAiAssistantOpen((prev) => !prev)}
      />

      {/* Main Workspace */}
      <div className="flex-1 w-full min-h-0 flex flex-col">
        <main className="flex-1 w-full max-w-7xl 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
          {activeTab === 'landing' && (
            <LandingPage
              onEnter={() => setActiveTab('overview')}
              onNavigateTo={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewDashboard
              targets={EXPLORATION_TARGETS}
              onSelectTarget={(t) => setSelectedTarget(t)}
              onNavigateToStep={handleWorkflowNavigation}
            />
          )}

          {activeTab === 'exploration' && (
            <ExplorationWorkspace
              targets={EXPLORATION_TARGETS}
              selectedTarget={selectedTarget}
              onSelectTarget={(t) => setSelectedTarget(t)}
              drillholes={DRILLHOLES}
              onNavigateToResource={handleSelectTargetAndEstimate}
            />
          )}

          {activeTab === 'resource' && (
            <ResourceWorkspace
              targets={EXPLORATION_TARGETS}
              selectedTarget={selectedTarget}
              onSelectTarget={(t) => setSelectedTarget(t)}
              onNavigateToProduction={() => setActiveTab('production')}
              onNavigateToExploration={() => setActiveTab('exploration')}
            />
          )}

          {activeTab === 'production' && (
            <ProductionWorkspace
              onNavigateToScenarios={() => setActiveTab('scenarios')}
              onNavigateToActions={() => setActiveTab('actions')}
            />
          )}

          {activeTab === 'scenarios' && (
            <ScenarioWorkspace
              onNavigateToActions={() => setActiveTab('actions')}
            />
          )}

          {activeTab === 'actions' && (
            <ActionsWorkspace
              onNavigateToOverview={() => setActiveTab('overview')}
              onNavigateToExploration={() => setActiveTab('exploration')}
            />
          )}

          {activeTab === 'datasources' && <DataSourcesView />}

          {activeTab === 'modelcenter' && <ModelCenterView />}

          {activeTab === 'architecture' && <SystemArchitectureView />}

          {activeTab === 'sihmatrix' && <SihMatrixView />}
        </main>
      </div>

      {/* Floating Small AI Assistant Widget */}
      <AiAssistantSidebar
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        currentTab={activeTab}
        selectedTarget={selectedTarget}
        onNavigateToTab={(tab) => setActiveTab(tab as MainTab)}
      />

      {/* Persistent Footer with Corporate Attribution & Scientific Honesty Disclaimer */}
      <footer className="bg-white border-t border-stone-200 px-4 py-3 text-xs text-stone-500 mt-auto">
        <div className="max-w-7xl 2xl:max-w-[1680px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-stone-800">Ore-Sentinel</span>
            <span className="text-stone-300">&bull;</span>
            <span className="text-stone-600">Explore &bull; Estimate &bull; Predict &bull; Act</span>
            <span className="text-stone-300">&bull;</span>
            <span className="text-stone-500">Balaghat–Nagpur Manganese Belt Pilot (SIH26009)</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="text-stone-600 hover:text-stone-900 font-medium transition-colors cursor-pointer underline decoration-stone-300 underline-offset-2"
            >
              Problem Specification
            </button>
            <span className="text-stone-300">&bull;</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80 font-mono text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              DEMO MODE: Simulated shift data
            </span>
          </div>
        </div>
      </footer>

      {/* Global About Modal */}
      <AboutProblemModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
