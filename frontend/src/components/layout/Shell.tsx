import React, { useState } from 'react';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { Footer } from './Footer';
import { CopilotDrawer } from './CopilotDrawer';
import { LoadingState, ErrorState } from '../common/LoadingState';
import { useWards } from '../../hooks/useWards';
import { NavigationTab, WorkflowPhase } from '../../types/api';

// Views
import { OverviewDashboard } from '../views/OverviewDashboard';
import { ClimateMapView } from '../views/ClimateMapView';
import { DetectView } from '../views/DetectView';
import { InvestigateView } from '../views/InvestigateView';
import { PredictView } from '../views/PredictView';
import { SimulateView } from '../views/SimulateView';
import { PrioritizeView } from '../views/PrioritizeView';
import { ActView } from '../views/ActView';
import { VerifyView } from '../views/VerifyView';
import { ReportsView } from '../views/ReportsView';
import { SettingsView } from '../views/SettingsView';
import { Sidebar as WardSidebar } from './Sidebar';
import { WorkflowNavigation } from './WorkflowNavigation';
import { ClimateEmergencyModal } from '../common/ClimateEmergencyModal';
import { DemoModeGuide } from '../common/DemoModeGuide';

export const Shell: React.FC = () => {
  const {
    wards,
    allWards,
    selectedWard,
    selectedWardId,
    setSelectedWardId,
    cityOverview,
    interventions,
    health,
    loading,
    error,
    zoneFilter,
    setZoneFilter,
    refresh,
  } = useWards();

  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavigationTab;
      if (tabParam) return tabParam;
      const hash = window.location.hash.replace('#', '').replace('/', '') as NavigationTab;
      if (hash) return hash;
    }
    return 'overview';
  });
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false);
  const [demoTourActive, setDemoTourActive] = useState<boolean>(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);

  // Map navigation tabs to underlying workflow phases for copilot context
  const getWorkflowPhase = (tab: NavigationTab): WorkflowPhase => {
    switch (tab) {
      case 'overview':
      case 'climate-map':
      case 'ward-intelligence':
      case 'detect':
        return 'detect';
      case 'ai-investigator':
      case 'investigate':
        return 'investigate';
      case 'predict':
        return 'predict';
      case 'climate-twin':
      case 'simulate':
        return 'simulate';
      case 'budget-optimizer':
      case 'prioritize':
        return 'prioritize';
      case 'act':
        return 'act';
      case 'action-ledger':
      case 'verify':
        return 'verify';
      default:
        return 'detect';
    }
  };

  const isWorkflowTab = [
    'detect',
    'ward-intelligence',
    'investigate',
    'ai-investigator',
    'predict',
    'simulate',
    'climate-twin',
    'prioritize',
    'budget-optimizer',
    'act',
    'verify',
    'action-ledger',
  ].includes(currentTab);

  if (loading && wards.length === 0) {
    return (
      <div className="h-screen w-screen bg-[#070B14]">
        <LoadingState message="INITIALIZING PUNE CLIMATE INTELLIGENCE WORKBENCH..." />
      </div>
    );
  }

  if (error && wards.length === 0) {
    return (
      <div className="h-screen w-screen bg-[#070B14]">
        <ErrorState message={error} onRetry={refresh} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F5F7F2] text-[#17251A] overflow-hidden font-sans">
      {/* 1. Top Navigation Bar */}
      <Header
        health={health}
        onOpenCopilot={() => setCopilotOpen((prev) => !prev)}
        copilotOpen={copilotOpen}
        selectedCity="Pune Metropolitan Region (PMC)"
        selectedZoneFilter={zoneFilter}
        onSelectZoneFilter={setZoneFilter}
        onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
        onToggleDemoMode={() => setDemoTourActive((prev) => !prev)}
        isDemoModeActive={demoTourActive}
      />

      {/* 2. Main Intelligence Command Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Application Sidebar */}
        <AppSidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        {/* Optional Secondary Ward Selector Drawer for Ward Intelligence & Workflow Tabs */}
        {isWorkflowTab && (
          <WardSidebar
            wards={allWards}
            selectedWardId={selectedWardId}
            onSelectWard={setSelectedWardId}
          />
        )}

        {/* Center Main Stage View Container */}
        <main className="flex-1 bg-[#F5F7F2] overflow-hidden flex flex-col min-w-0">
          {/* Detect-to-Verify 7-Phase Stepper Navigation */}
          {isWorkflowTab && (
            <WorkflowNavigation
              currentPhase={getWorkflowPhase(currentTab)}
              onPhaseChange={(phase) => setCurrentTab(phase as NavigationTab)}
            />
          )}

          {currentTab === 'overview' && (
            <OverviewDashboard
              overview={cityOverview}
              wards={allWards}
              interventions={interventions}
              onSelectWard={(wId) => {
                setSelectedWardId(wId);
                setCurrentTab('detect');
              }}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'climate-map' && (
            <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
              <ClimateMapView
                wards={allWards}
                selectedWard={selectedWard}
                onSelectWard={setSelectedWardId}
                onNavigateTab={setCurrentTab}
              />
            </div>
          )}

          {/* 1. Detect View */}
          {(currentTab === 'detect' || currentTab === 'ward-intelligence') && (
            <DetectView ward={selectedWard} overview={cityOverview} onNavigateTab={setCurrentTab} />
          )}

          {/* 2. Investigate View */}
          {(currentTab === 'investigate' || currentTab === 'ai-investigator') && (
            <InvestigateView ward={selectedWard} onNavigateTab={setCurrentTab} />
          )}

          {/* 3. Predict View */}
          {currentTab === 'predict' && (
            <PredictView ward={selectedWard} onNavigateTab={setCurrentTab} />
          )}

          {/* 4. Simulate View */}
          {(currentTab === 'simulate' || currentTab === 'climate-twin') && (
            <SimulateView
              ward={selectedWard}
              wards={allWards}
              onSelectWard={setSelectedWardId}
              onNavigateTab={setCurrentTab}
            />
          )}

          {/* 5. Prioritize View */}
          {(currentTab === 'prioritize' || currentTab === 'budget-optimizer') && (
            <PrioritizeView
              ward={selectedWard}
              wards={allWards}
              onSelectWard={setSelectedWardId}
              onNavigateTab={setCurrentTab}
            />
          )}

          {/* 6. Act View */}
          {currentTab === 'act' && (
            <ActView ward={selectedWard} onNavigateTab={setCurrentTab} />
          )}

          {/* 7. Verify View */}
          {(currentTab === 'verify' || currentTab === 'action-ledger') && (
            <VerifyView ward={selectedWard} />
          )}

          {currentTab === 'reports' && (
            <ReportsView overview={cityOverview} wards={allWards} />
          )}

          {currentTab === 'settings' && (
            <SettingsView health={health} onRefreshHealth={refresh} />
          )}
        </main>

        {/* AI Copilot Drawer */}
        <CopilotDrawer
          isOpen={copilotOpen}
          onClose={() => setCopilotOpen(false)}
          ward={selectedWard}
          currentPhase={getWorkflowPhase(currentTab)}
        />
      </div>

      {/* 3. Official Municipal Footer */}
      <Footer />

      {/* Climate Emergency Mode Modal */}
      <ClimateEmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        wards={allWards}
        overview={cityOverview}
        interventions={interventions}
        onNavigateTab={setCurrentTab}
        onSelectWard={setSelectedWardId}
      />

      {/* 5-7 Minute Interactive Hackathon Demo Tour Guide */}
      <DemoModeGuide
        isActive={demoTourActive}
        currentStepIndex={demoStepIndex}
        onStepChange={setDemoStepIndex}
        onClose={() => setDemoTourActive(false)}
        onNavigateTab={setCurrentTab}
        onSelectWard={setSelectedWardId}
      />
    </div>
  );
};
