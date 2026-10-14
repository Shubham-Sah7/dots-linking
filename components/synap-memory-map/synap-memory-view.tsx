'use client';

import React, { useState, useCallback } from 'react';
import { SYNAP_CLIENT_DATA } from './mock-data';
import {
  CustomerScope,
  UserScope,
  MemoryItem,
  EntityCategory,
} from './types';
import { MemoryMapCanvas } from './memory-map-canvas';
import { GraphFilterHeader } from './graph-filter-header';
import { MemoryDetailPanel } from './memory-detail-panel';
import { CanvasBottomControls } from './canvas-bottom-controls';
import { MemoryTableView } from './memory-table-view';
import { FounderGuideBanner } from './founder-guide-banner';
import { ReferencePatternModal } from './dotted-pattern';
import { GraphSidebar, NavItemKey } from './graph-sidebar';

export function SynapMemoryView() {
  const [activeCustomer, setActiveCustomer] = useState<CustomerScope | null>(null);
  const [activeUser, setActiveUser] = useState<UserScope | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<EntityCategory | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Superseded'>('All');
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [isTableView, setIsTableView] = useState<boolean>(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState<boolean>(true);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState<boolean>(false);
  const [patternMode, setPatternMode] = useState<'integrated' | 'reference'>('integrated');
  const [activeNav, setActiveNav] = useState<NavItemKey>('dashboard');
  const [cameraFocusTarget, setCameraFocusTarget] = useState<{
    x: number;
    y: number;
    zoom?: number;
    t?: number;
  } | null>(null);

  // Scope navigation handlers
  const handleSelectCustomer = useCallback((customer: CustomerScope | null) => {
    setActiveCustomer(customer);
    setActiveUser(null);
    setSelectedMemory(null);

    if (customer && customer.bounds) {
      setCameraFocusTarget({
        x: customer.bounds.x + customer.bounds.width / 2,
        y: customer.bounds.y + customer.bounds.height / 2,
        zoom: 1.22,
        t: Date.now(),
      });
    }
  }, []);

  const handleSelectUser = useCallback(
    (user: UserScope | null) => {
      setActiveUser(user);
      setSelectedMemory(null);

      if (user && user.bounds) {
        setCameraFocusTarget({
          x: user.bounds.x + user.bounds.width / 2,
          y: user.bounds.y + user.bounds.height / 2,
          zoom: 1.52,
          t: Date.now(),
        });
      }
    },
    []
  );

  const handleSelectMemory = useCallback((memory: MemoryItem | null) => {
    setSelectedMemory(memory);
    if (memory) {
      setIsDetailPanelOpen(true);
      // Synchronize ownership scope hierarchy: Client -> Customer -> User
      if (memory.scopeType === 'user') {
        for (const cust of SYNAP_CLIENT_DATA.customers) {
          const u = cust.users.find((usr) => usr.id === memory.scopeId);
          if (u) {
            setActiveCustomer(cust);
            setActiveUser(u);
            break;
          }
        }
      } else if (memory.scopeType === 'customer') {
        const cust = SYNAP_CLIENT_DATA.customers.find((c) => c.id === memory.scopeId);
        if (cust) {
          setActiveCustomer(cust);
          setActiveUser(null);
        }
      } else {
        // Client-level memory
        setActiveCustomer(null);
        setActiveUser(null);
      }

      if (memory.x !== undefined && memory.y !== undefined) {
        setCameraFocusTarget({
          x: memory.x,
          y: memory.y,
          zoom: 1.65,
          t: Date.now(),
        });
      }
    }
  }, []);

  const handleFocusMemory = useCallback((memory: MemoryItem) => {
    handleSelectMemory(memory);
  }, [handleSelectMemory]);

  const handleResetView = useCallback(() => {
    setActiveCustomer(null);
    setActiveUser(null);
    setSelectedMemory(null);
    setCategoryFilter(null);
    setStatusFilter('All');
    const clientBounds = SYNAP_CLIENT_DATA.bounds || { x: 30, y: 30, width: 1380, height: 650 };
    setCameraFocusTarget({
      x: clientBounds.x + clientBounds.width / 2,
      y: clientBounds.y + clientBounds.height / 2,
      zoom: undefined, // Signals fitCameraToViewport
      t: Date.now(),
    });
  }, []);

  // Dedicated Scope Tier Transitions (Zoom-out -> Zoom-in -> Deep Memory)
  const handleFocusScopeTier = useCallback(
    (tier: 'overview' | 'customer' | 'user' | 'memory') => {
      if (tier === 'overview') {
        handleResetView();
      } else if (tier === 'customer') {
        const targetCust = activeCustomer || SYNAP_CLIENT_DATA.customers[0];
        handleSelectCustomer(targetCust);
      } else if (tier === 'user') {
        const targetCust = activeCustomer || SYNAP_CLIENT_DATA.customers[0];
        const targetUsr = activeUser || targetCust.users[0];
        setActiveCustomer(targetCust);
        handleSelectUser(targetUsr);
      } else if (tier === 'memory') {
        const targetMem =
          selectedMemory ||
          SYNAP_CLIENT_DATA.customers[0].users[0].memories[0];
        handleSelectMemory(targetMem);
      }
    },
    [activeCustomer, activeUser, selectedMemory, handleResetView, handleSelectCustomer, handleSelectUser, handleSelectMemory]
  );

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel((z) => Math.min(3.0, +(z + 0.2).toFixed(2)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((z) => Math.max(0.35, +(z - 0.2).toFixed(2)));
  }, []);

  const handleToggleDetailPanel = useCallback(() => {
    setIsDetailPanelOpen((prev) => !prev);
  }, []);

  const handleNavigate = useCallback(
    (key: NavItemKey) => {
      setActiveNav(key);
      if (key === 'graph' || key === 'dashboard' || key === 'memories') {
        setIsTableView(false);
        if (key === 'graph' || key === 'memories') {
          handleResetView();
        }
      }
      // Any other nav does not navigate away — only graph works
    },
    [handleResetView]
  );

  return (
    <div className="flex-1 min-h-0 w-full bg-[#1B1B19] text-white flex flex-row font-sans select-none overflow-hidden">
      {/* Fixed Full-Height Left Navigation Sidebar matching reference image */}
      <GraphSidebar
        activeNav={activeNav}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area (Header, Canvas, Detail Panel) */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* 1. Header with Title, Metrics, Search, Scope Breadcrumb & Filters */}
        <GraphFilterHeader
          data={SYNAP_CLIENT_DATA}
          activeCustomer={activeCustomer}
          activeUser={activeUser}
          selectedMemory={selectedMemory}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          onSelectCustomer={handleSelectCustomer}
          onSelectUser={handleSelectUser}
          onSelectMemory={handleSelectMemory}
          onCategoryFilterChange={setCategoryFilter}
          onStatusFilterChange={setStatusFilter}
          onResetView={handleResetView}
          isTableView={isTableView}
          onToggleTableView={() => setIsTableView((prev) => !prev)}
          isDetailPanelOpen={isDetailPanelOpen}
          onToggleDetailPanel={handleToggleDetailPanel}
        />

        {/* 2. Main Content Area */}
        {isTableView ? (
          <MemoryTableView
            data={SYNAP_CLIENT_DATA}
            onSelectMemory={(mem) => {
              handleSelectMemory(mem);
              setIsTableView(false);
            }}
          />
        ) : (
          <div className="relative w-full flex-1 flex flex-row overflow-hidden min-h-0">
            {/* Central Interactive Graph Canvas */}
            <div className="relative flex-1 flex flex-col min-w-0 h-full">
              <MemoryMapCanvas
                data={SYNAP_CLIENT_DATA}
                activeCustomer={activeCustomer}
                activeUser={activeUser}
                selectedMemory={selectedMemory}
                categoryFilter={categoryFilter}
                statusFilter={statusFilter}
                onSelectCustomer={handleSelectCustomer}
                onSelectUser={handleSelectUser}
                onSelectMemory={handleSelectMemory}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                cameraFocusTarget={cameraFocusTarget}
                isDetailPanelOpen={isDetailPanelOpen}
                patternMode={patternMode}
              />

              {/* Bottom Legend & Camera Zoom Controls */}
              <CanvasBottomControls
                zoomLevel={zoomLevel}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetView}
                onOpenGuide={() => setIsGuideOpen(true)}
                isDetailPanelOpen={isDetailPanelOpen}
                onToggleDetailPanel={handleToggleDetailPanel}
                patternMode={patternMode}
                onTogglePatternMode={() =>
                  setPatternMode((prev) => (prev === 'reference' ? 'integrated' : 'reference'))
                }
                onOpenPatternModal={() => setIsPatternModalOpen(true)}
                onFocusScopeTier={handleFocusScopeTier}
              />
            </div>

            {/* Contextual Side Inspection Panel */}
            {isDetailPanelOpen && (
              <MemoryDetailPanel
                memory={selectedMemory}
                data={SYNAP_CLIENT_DATA}
                activeCustomer={activeCustomer}
                activeUser={activeUser}
                onSelectCustomer={handleSelectCustomer}
                onSelectUser={handleSelectUser}
                onSelectMemory={handleSelectMemory}
                onClose={() => {
                  if (selectedMemory) {
                    setSelectedMemory(null);
                  } else {
                    setIsDetailPanelOpen(false);
                  }
                }}
                onFocusMemory={handleFocusMemory}
              />
            )}
          </div>
        )}
      </div>

      {/* 3. Founder Specification Guide Modal */}
      <FounderGuideBanner isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* 4. Dotted Pattern Visual Component Inspector Modal */}
      <ReferencePatternModal
        isOpen={isPatternModalOpen}
        onClose={() => setIsPatternModalOpen(false)}
      />
    </div>
  );
}
