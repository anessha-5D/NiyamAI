import React, { useEffect, useRef } from 'react';
import { ExternalLink, ShieldCheck, RefreshCw, Download, Award } from 'lucide-react';
import type { CorrectionRecord, HistoryEntry } from '../types';

interface PublishingAnalyticsProps {
  approvedRecords?: CorrectionRecord[];
  history?: HistoryEntry[];
  pushToast?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export function PublishingAnalytics({ approvedRecords = [], history = [], pushToast }: PublishingAnalyticsProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync approved records from Member 4 into Member 5's localStorage
  useEffect(() => {
    try {
      const existingRaw = localStorage.getItem('niyamai_assets_v1');
      let currentAssets: any[] = [];
      if (existingRaw) {
        currentAssets = JSON.parse(existingRaw);
      }

      // Check if any approved record from Member 4 needs syncing into Member 5
      let updated = false;
      approvedRecords.forEach((rec) => {
        const assetId = `AST-${rec.id.replace('rec-', '')}`;
        const foundIdx = currentAssets.findIndex((a: any) => a.id === assetId);

        const assetPayload = {
          id: assetId,
          title: rec.contentTitle,
          category: rec.contentType.replace('-', ' ').toUpperCase(),
          author: 'Content Team & Compliance Officer',
          date: new Date().toISOString().substring(0, 10),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          wordCount: rec.workingContent.split(/\s+/).filter(Boolean).length,
          overallScore: 97,
          thresholdStatus: 'PASSED',
          status: 'Ready to Publish',
          approvals: {
            current: 2,
            required: 2,
            signedBy: ['Authorized Compliance Officer', 'Executive Brand Director']
          },
          scores: {
            tone: 96,
            claims: 98,
            accessibility: 95,
            visual: 98
          },
          channels: ['Corporate Website', 'PR Newswire', 'LinkedIn Executive'],
          summary: rec.workingContent.substring(0, 140) + '...',
          governanceHash: null,
          auditTrail: [
            {
              step: 1,
              stage: 'INGEST',
              actor: 'Anessha Verma',
              role: 'Content Creator',
              time: '09:00 AM',
              action: 'Ingested via Brand Kit Connector',
              detail: `Initial draft: "${rec.originalContent.substring(0, 80)}..."`,
              status: 'completed'
            },
            {
              step: 2,
              stage: 'AI_AUDIT',
              actor: 'Snehal Boyane',
              role: 'AI Audit Engine',
              time: '09:05 AM',
              action: 'Flagged compliance violation',
              detail: rec.detectedIssue,
              status: 'completed'
            },
            {
              step: 3,
              stage: 'CORRECTION',
              actor: 'Tanvi Deshmukh',
              role: 'Visual & Correction Specialist',
              time: '09:20 AM',
              action: 'Applied remediation',
              detail: rec.aiSuggestion.explanation,
              status: 'completed'
            },
            {
              step: 4,
              stage: 'HUMAN_REVIEW',
              actor: 'Diya Waja',
              role: 'Legal & Regulatory Reviewer',
              time: '09:45 AM',
              action: 'Human Approval Granted',
              detail: rec.approvalComment || 'Approved for public distribution after intent-preserving verification.',
              status: 'approved'
            }
          ]
        };

        if (foundIdx === -1) {
          currentAssets.unshift(assetPayload);
          updated = true;
        } else if (currentAssets[foundIdx].status !== 'Published') {
          currentAssets[foundIdx] = { ...currentAssets[foundIdx], ...assetPayload };
          updated = true;
        }
      });

      if (updated && currentAssets.length > 0) {
        localStorage.setItem('niyamai_assets_v1', JSON.stringify(currentAssets));
        // If iframe is loaded, trigger reload so it updates seamlessly
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.location.reload();
        }
      }
    } catch (err) {
      console.warn('LocalStorage sync issue:', err);
    }
  }, [approvedRecords]);

  const handleReloadIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.location.reload();
      pushToast?.('Refreshed Publishing Gate & Analytics data.', 'info');
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#FAF7F5] min-h-screen">
      {/* Top Integration Control Ribbon */}
      <div className="bg-[#330B18] text-[#E8DED8] px-4 sm:px-8 py-3.5 border-b border-[#4E1227] flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-16 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-full bg-[#4E1227] text-white flex items-center justify-center font-bold text-xs border border-plum-700">
            ✓
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white font-display">
                Pre-Publish Gatekeeper, Provenance & Governance Analytics
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1C060D] text-emerald-400 border border-[#4E1227] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Pipeline Synced
              </span>
            </div>
            <p className="text-[11px] text-stone-300 hidden sm:block">
              Multi-vector brand threshold gate, Web Crypto SHA-256 tamper-evident audit hash chain, and executive analytics.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh Iframe */}
          <button
            onClick={handleReloadIframe}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#4E1227] hover:bg-[#691D37] text-white text-xs font-semibold border border-[#691D37] transition shadow-xs"
            title="Reload live governance state"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh State</span>
          </button>

          {/* Standalone Open Button */}
          <a
            href="/member5.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white text-plum-950 hover:bg-plum-50 text-xs font-bold transition shadow-xs"
            title="Open Publishing & Governance page in a dedicated browser tab"
          >
            <span>Open Standalone Tab</span>
            <ExternalLink className="w-3.5 h-3.5 text-plum-950" />
          </a>
        </div>
      </div>

      {/* Embedded 100% Original Standalone Page */}
      <div className="w-full flex-1">
        <iframe
          ref={iframeRef}
          src="/member5.html"
          title="NiyamAI Publishing Gatekeeper & Governance Analytics"
          className="w-full border-none"
          style={{
            height: 'calc(100vh - 120px)',
            minHeight: '1400px'
          }}
        />
      </div>
    </div>
  );
}
