"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaScaleBalanced,
  FaShieldHalved,
  FaArrowLeft,
  FaFloppyDisk,
  FaTrashCan,
  FaUpload,
  FaPlus,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaPen,
  FaCheck,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { useAdminConfirm } from "@/components/admin/context";
import { ButtonHelpBadge } from "@/components/admin/ui/ButtonHelpTooltip";
import { BUTTON_HELP } from "@/lib/admin/constants/button-help";
import {
  saveDraftAction,
  discardDraftAction,
  publishDocumentAction,
} from "@/lib/actions/legal.actions";
import { FaRotate, FaCircleCheck } from "react-icons/fa6";
import { MarkdownLegalRenderer } from "@/components/legal/MarkdownLegalRenderer";
import type { LegalDocument, LegalSection } from "@/types/legal";

interface LegalEditorClientProps {
  termsDoc: LegalDocument | null;
  privacyDoc: LegalDocument | null;
}

function getFormattedToday(): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function getNextPatchVersion(curr: string): string {
  if (!curr) return "0.0.2";
  const parts = curr.trim().split(".").map((p) => parseInt(p, 10));
  if (parts.length >= 3 && !isNaN(parts[2])) {
    return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
  return "0.0.2";
}

function getNextMinorVersion(curr: string): string {
  if (!curr) return "0.1.0";
  const parts = curr.trim().split(".").map((p) => parseInt(p, 10));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return `${parts[0]}.${parts[1] + 1}.0`;
  }
  return "0.1.0";
}

export const LegalEditorClient: React.FC<LegalEditorClientProps> = ({
  termsDoc,
  privacyDoc,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useAdminConfirm();

  const docParam = searchParams.get("doc");
  const [activeDocType, setActiveDocType] = useState<"TERMS" | "PRIVACY">(
    docParam === "PRIVACY" ? "PRIVACY" : "TERMS"
  );

  const currentActiveDoc = activeDocType === "TERMS" ? termsDoc : privacyDoc;

  // Form State
  const [version, setVersion] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [lastUpdatedDate, setLastUpdatedDate] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Status & Notification state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Step-by-Step Publishing Flow State ("Slow deliberate UI/UX")
  const [isPublishingFlow, setIsPublishingFlow] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishCurrentStep, setPublishCurrentStep] = useState("");
  const [publishCompleted, setPublishCompleted] = useState(false);

  // Sync state when active document changes or mounts
  useEffect(() => {
    if (!currentActiveDoc) return;

    const todayStr = getFormattedToday();

    if (currentActiveDoc.draft) {
      setVersion(currentActiveDoc.draft.version);
      // Fixed day date crafted as before, preserved from draft or document
      setEffectiveDate(currentActiveDoc.draft.effectiveDate?.trim() || currentActiveDoc.effectiveDate?.trim() || "January 1, 2026");
      // Dynamic live date: defaults to today's date
      setLastUpdatedDate(todayStr);
      setChangeSummary(currentActiveDoc.draft.changeSummary || "");
      setSections([...currentActiveDoc.draft.sections]);
    } else {
      // Auto-suggest next patch version so admin doesn't have to calculate it manually
      const nextVer = getNextPatchVersion(currentActiveDoc.publishedVersion || "0.0.1");
      setVersion(nextVer);
      // Fixed day date crafted as before
      setEffectiveDate(currentActiveDoc.effectiveDate?.trim() || "January 1, 2026");
      // Dynamic live date: defaults to today's live date
      setLastUpdatedDate(todayStr);
      setChangeSummary("");
      setSections([...currentActiveDoc.sections]);
    }

    if (currentActiveDoc.sections.length > 0) {
      setActiveSectionId(currentActiveDoc.sections[0].id);
    }
    setFeedback(null);
  }, [activeDocType, currentActiveDoc]);

  const handleDocTypeChange = (type: "TERMS" | "PRIVACY") => {
    setActiveDocType(type);
    router.replace(`/admin/legal/editor?doc=${type}`);
  };

  // Section Manipulation Handlers
  const handleAddSection = () => {
    const newId = `new-section-${Date.now()}`;
    const newSection: LegalSection = {
      id: newId,
      heading: `${sections.length + 1}. New Policy Section`,
      filterMode: "all",
      contentMarkdown: "Enter clause content in markdown format...",
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setActiveSectionId(newId);
  };

  const handleUpdateSection = (
    index: number,
    field: keyof LegalSection,
    value: unknown
  ) => {
    setSections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveSection = (index: number) => {
    setSections((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      return copy.map((sec, idx) => ({ ...sec, order: idx }));
    });
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    setSections((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((sec, idx) => ({ ...sec, order: idx }));
    });
  };

  // Save Draft Action with deliberate, smooth cadence
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setFeedback(null);

    const todayStr = getFormattedToday();
    const finalEffective = effectiveDate.trim() || "January 1, 2026";
    const finalUpdated = lastUpdatedDate.trim() || todayStr;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const [res] = await Promise.all([
      saveDraftAction({
        docType: activeDocType,
        version: version.trim(),
        effectiveDate: finalEffective,
        lastUpdatedDate: finalUpdated,
        changeSummary: changeSummary.trim(),
        isMaterialChange: true,
        sections,
      }),
      sleep(750), // Smooth deliberate cadence
    ]);

    setSavingDraft(false);

    if (res.success) {
      setFeedback({
        type: "success",
        message: `Draft saved! Your changes are stored safely and ready to publish.`,
      });
      router.refresh();
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to save draft.",
      });
    }
  };

  // Discard Draft Action
  const handleDiscardDraft = async () => {
    const ok = await confirm({
      title: "Discard Working Draft?",
      description:
        "This will discard all uncommitted draft changes and reload the currently published live version.",
      variant: "danger",
      confirmLabel: "Discard Changes",
    });

    if (!ok) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await discardDraftAction({ docType: activeDocType });
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: "success",
        message: "Draft discarded. Restored published version.",
      });
      if (currentActiveDoc) {
        const todayStr = getFormattedToday();
        setVersion(getNextPatchVersion(currentActiveDoc.publishedVersion || "0.0.1"));
        setEffectiveDate(currentActiveDoc.effectiveDate?.trim() || "January 1, 2026");
        setLastUpdatedDate(todayStr);
        setChangeSummary("");
        setSections([...currentActiveDoc.sections]);
      }
      router.refresh();
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to discard draft.",
      });
    }
  };

  // Publish Revision Action with smooth step-by-step progress flow
  const handlePublish = async () => {
    if (!currentActiveDoc) return;

    if (!version.trim()) {
      setFeedback({
        type: "error",
        message: "Please enter a version identifier (e.g. 0.0.1, 0.0.2).",
      });
      return;
    }

    const docName = activeDocType === "TERMS" ? "Terms of Service" : "Privacy Policy";

    const ok = await confirm({
      title: `Publish ${docName} v${version.trim()}`,
      description: `You are publishing version ${version.trim()} of the ${docName} to the live website. This will update the public policy and archive the previous version.`,
      variant: "purple",
      confirmLabel: "Publish Changes",
    });

    if (!ok) return;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Launch deliberate step-by-step publishing flow ("slow UI/UX")
    setIsPublishingFlow(true);
    setPublishCompleted(false);
    setPublishProgress(25);
    setPublishCurrentStep(`Checking ${docName} v${version.trim()}...`);

    await sleep(650);
    setPublishProgress(50);
    setPublishCurrentStep("Saving previous version to archive ledger...");

    await sleep(700);
    setPublishProgress(75);
    setPublishCurrentStep(`Publishing live ${docName} to website...`);

    const todayStr = getFormattedToday();
    const finalEffective = effectiveDate.trim() || "January 1, 2026";
    const finalUpdated = lastUpdatedDate.trim() || todayStr;

    const res = await publishDocumentAction({
      docType: activeDocType,
      expectedVersion: currentActiveDoc.version,
      version: version.trim(),
      effectiveDate: finalEffective,
      lastUpdatedDate: finalUpdated,
      changeSummary: changeSummary.trim(),
      isMaterialChange: true,
      sections,
    });

    if (!res.success) {
      setIsPublishingFlow(false);
      setFeedback({
        type: "error",
        message: res.error || "Failed to publish document revision.",
      });
      return;
    }

    setPublishProgress(90);
    setPublishCurrentStep("Finalizing publication & synchronizing updates...");
    await sleep(650);

    setPublishProgress(100);
    setPublishCurrentStep("All done! Your new revision is live.");
    setPublishCompleted(true);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/legal"
          className="inline-flex items-center gap-2 text-xs font-admin-mono font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <FaArrowLeft className="w-3 h-3" />
          <span>Back to Legal Overview</span>
        </Link>

        {/* Document Selector Switcher */}
        <div className="inline-flex p-1 bg-[#FFFFFF] border border-[#E2E8F0] rounded-sm shadow-2xs">
          <button
            type="button"
            onClick={() => handleDocTypeChange("TERMS")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-admin-mono font-semibold transition-all cursor-pointer ${
              activeDocType === "TERMS"
                ? "bg-[#7C3AED] text-[#FFFFFF] shadow-2xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <FaScaleBalanced className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
          <button
            type="button"
            onClick={() => handleDocTypeChange("PRIVACY")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-admin-mono font-semibold transition-all cursor-pointer ${
              activeDocType === "PRIVACY"
                ? "bg-[#7C3AED] text-[#FFFFFF] shadow-2xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <FaShieldHalved className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-sm border text-xs font-admin-mono flex items-start justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <FaCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <FaTriangleExclamation className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metadata & Governance Controls Bar */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-sm p-5 shadow-2xs space-y-4">
        <div className="border-b border-[#F1F5F9] pb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0F172A] font-admin">
            Document Metadata &amp; Publication Settings
          </h3>
          <span className="text-xs font-admin-mono text-[#64748B]">
            Current Concurrency Version: #{currentActiveDoc?.version || 0}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-admin-mono font-semibold text-[#475569]">
                Revision Version (SemVer)
              </label>
              <span className="text-[10px] font-admin-mono text-[#64748B]">
                v{currentActiveDoc?.publishedVersion || "0.0.1"} (Live)
              </span>
            </div>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 0.0.2"
              className="w-full px-3 py-2 text-xs font-admin-mono border border-[#CBD5E1] rounded-sm bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:border-[#7C3AED]"
            />
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setVersion(getNextPatchVersion(currentActiveDoc?.publishedVersion || "0.0.1"))}
                className="text-[10px] font-admin-mono px-2 py-0.5 rounded border border-[#E2E8F0] bg-[#FAFAFA] hover:bg-[#F1F5F9] text-[#475569] transition-colors cursor-pointer"
                title="Increment patch version"
              >
                + Patch ({getNextPatchVersion(currentActiveDoc?.publishedVersion || "0.0.1")})
              </button>
              <button
                type="button"
                onClick={() => setVersion(getNextMinorVersion(currentActiveDoc?.publishedVersion || "0.0.1"))}
                className="text-[10px] font-admin-mono px-2 py-0.5 rounded border border-[#E2E8F0] bg-[#FAFAFA] hover:bg-[#F1F5F9] text-[#475569] transition-colors cursor-pointer"
                title="Increment minor version"
              >
                + Minor ({getNextMinorVersion(currentActiveDoc?.publishedVersion || "0.0.1")})
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-admin-mono font-semibold text-[#475569]">
                Effective Date
              </label>
              <span className="text-[10px] font-admin-mono px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-medium">
                Day Date (Fixed)
              </span>
            </div>
            <input
              type="text"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              placeholder="e.g. January 1, 2026"
              className="w-full px-3 py-2 text-xs font-admin-mono border border-[#CBD5E1] rounded-sm bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:border-[#7C3AED]"
            />
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setEffectiveDate("January 1, 2026")}
                className="text-[10px] font-admin-mono px-2 py-0.5 rounded border border-[#E2E8F0] bg-[#FAFAFA] hover:bg-[#F1F5F9] text-[#475569] transition-colors cursor-pointer"
                title="Reset to original crafted date"
              >
                Jan 1, 2026 (Crafted)
              </button>
              <button
                type="button"
                onClick={() => setEffectiveDate(getFormattedToday())}
                className="text-[10px] font-admin-mono px-2 py-0.5 rounded border border-[#E2E8F0] bg-[#FAFAFA] hover:bg-[#F1F5F9] text-[#475569] transition-colors cursor-pointer"
                title="Set to today's date"
              >
                Use Today
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-admin-mono font-semibold text-[#475569]">
                Last Updated Date
              </label>
              <span className="text-[10px] font-admin-mono px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#7C3AED] font-semibold">
                Dynamic Live Date
              </span>
            </div>
            <input
              type="text"
              value={lastUpdatedDate}
              onChange={(e) => setLastUpdatedDate(e.target.value)}
              placeholder="e.g. September 7, 2026"
              className="w-full px-3 py-2 text-xs font-admin-mono border border-[#CBD5E1] rounded-sm bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:border-[#7C3AED]"
            />
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setLastUpdatedDate(getFormattedToday())}
                className="text-[10px] font-admin-mono px-2 py-0.5 rounded border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] font-semibold transition-colors cursor-pointer"
                title="Sync with today's live date"
              >
                Sync Today (Live)
              </button>
              <button
                type="button"
                onClick={() => setLastUpdatedDate(effectiveDate)}
                className="text-[10px] font-admin-mono px-2 py-0.5 rounded border border-[#E2E8F0] bg-[#FAFAFA] hover:bg-[#F1F5F9] text-[#475569] transition-colors cursor-pointer"
                title="Match effective date"
              >
                Match Effective Date
              </button>
            </div>
          </div>
        </div>

        {/* Revision Note (Internal Only) */}
        <div className="pt-3 border-t border-[#F8FAFC] space-y-2">
          <label className="block text-xs font-admin-mono font-semibold text-[#475569]">
            Revision Note (Optional &mdash; saved in Admin History only)
          </label>
          <textarea
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            rows={2}
            placeholder="Optional internal note for your records... Leave blank if not needed."
            className="w-full px-3 py-2 text-xs font-admin-mono border border-[#CBD5E1] rounded-sm bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        {/* Editor Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting || savingDraft}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-admin-mono font-semibold bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] rounded-sm transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {savingDraft ? (
                <FaRotate className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
              ) : (
                <FaFloppyDisk className="w-3.5 h-3.5 text-[#64748B]" />
              )}
              <span>{savingDraft ? "Saving Draft..." : "Save Draft"}</span>
              <ButtonHelpBadge text={BUTTON_HELP.LEGAL_SAVE_DRAFT} />
            </button>

            <button
              type="button"
              onClick={handleDiscardDraft}
              disabled={isSubmitting || savingDraft}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-admin-mono font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <FaTrashCan className="w-3.5 h-3.5 text-rose-600" />
              <span>Discard Draft</span>
              <ButtonHelpBadge text={BUTTON_HELP.LEGAL_DISCARD_DRAFT} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLivePreview(!isLivePreview)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-admin-mono font-semibold bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-sm transition-all cursor-pointer"
            >
              {isLivePreview ? (
                <>
                  <FaPen className="w-3 h-3" />
                  <span>Editor Only</span>
                </>
              ) : (
                <>
                  <FaEye className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Split Live Preview</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting || savingDraft}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-admin-mono font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-[#FFFFFF] rounded-sm transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <FaUpload className="w-3.5 h-3.5" />
              <span>Publish Revision</span>
              <ButtonHelpBadge text={BUTTON_HELP.LEGAL_PUBLISH} />
            </button>
          </div>
        </div>
      </div>

      {/* Sections Manager Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A] font-admin">
            Document Sections &amp; Clause Registry ({sections.length})
          </h3>
          <p className="text-xs text-[#64748B] font-admin-mono">
            Anchor slugs map directly to public hash URLs and spotlight filters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddSection}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-admin-mono font-semibold bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#7C3AED] border border-[#DDD6FE] rounded-sm transition-all cursor-pointer shadow-2xs"
        >
          <FaPlus className="w-3 h-3" />
          <span>Add Section</span>
        </button>
      </div>

      {/* Sections List and Editor */}
      <div className="space-y-4">
        {sections.map((sec, idx) => {
          const isExpanded = activeSectionId === sec.id;

          return (
            <div
              key={sec.id}
              className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-sm shadow-2xs overflow-hidden transition-all"
            >
              {/* Collapsed Header */}
              <div
                onClick={() => setActiveSectionId(isExpanded ? null : sec.id)}
                className="p-3.5 sm:p-4 bg-[#F8FAFC] flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F1F5F9]/70 select-none border-b border-[#E2E8F0]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E2E8F0] text-[#0F172A] text-xs font-admin-mono font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-admin-mono font-bold text-[#0F172A]">
                      {sec.heading}
                    </h4>
                    <span className="text-[11px] text-[#64748B] font-admin-mono">
                      Anchor: #{sec.id} • Filter Mode: {sec.filterMode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleMoveSection(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <FaArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSection(idx, "down")}
                    disabled={idx === sections.length - 1}
                    className="p-1 text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <FaArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(idx)}
                    className="p-1 text-rose-600 hover:text-rose-800 ml-2 cursor-pointer"
                    title="Delete Clause"
                  >
                    <FaTrashCan className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-admin-mono font-semibold text-[#475569] mb-1">
                        Anchor Slug ID
                      </label>
                      <input
                        type="text"
                        value={sec.id}
                        onChange={(e) =>
                          handleUpdateSection(idx, "id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                        }
                        className="w-full px-3 py-2 text-xs font-admin-mono border border-[#CBD5E1] rounded-sm text-[#0F172A]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-admin-mono font-semibold text-[#475569] mb-1">
                        Display Heading
                      </label>
                      <input
                        type="text"
                        value={sec.heading}
                        onChange={(e) => handleUpdateSection(idx, "heading", e.target.value)}
                        className="w-full px-3 py-2 text-xs font-admin-mono border border-[#CBD5E1] rounded-sm text-[#0F172A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-admin-mono font-semibold text-[#475569] mb-1">
                      Spotlight Tab Binding
                    </label>
                    <select
                      value={sec.filterMode}
                      onChange={(e) =>
                        handleUpdateSection(
                          idx,
                          "filterMode",
                          e.target.value as LegalSection["filterMode"]
                        )
                      }
                      className="w-full sm:w-64 px-3 py-2 text-xs font-admin-mono border border-[#CBD5E1] rounded-sm bg-[#FFFFFF] text-[#0F172A]"
                    >
                      <option value="all">Full Policy Only (all)</option>
                      <option value="contact">Contact Form Spotlight (contact)</option>
                      <option value="assistant">Personal Assistant Spotlight (assistant)</option>
                      <option value="whatsapp">WhatsApp Recruiter Spotlight (whatsapp)</option>
                    </select>
                  </div>

                  {/* Markdown Content Area / Split Preview */}
                  <div className="space-y-2">
                    <label className="block text-xs font-admin-mono font-semibold text-[#475569]">
                      Clause Body (Markdown)
                    </label>

                    {isLivePreview ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <textarea
                          value={sec.contentMarkdown}
                          onChange={(e) => handleUpdateSection(idx, "contentMarkdown", e.target.value)}
                          rows={12}
                          className="w-full p-3 text-xs font-admin-mono border border-[#CBD5E1] rounded-sm text-[#0F172A] font-mono leading-relaxed"
                        />
                        <div className="p-4 rounded-sm bg-[#000319] text-[#C1C2D3] border border-white/10 overflow-y-auto max-h-[320px]">
                          <div className="text-[10px] uppercase font-mono tracking-wider text-purple mb-2">
                            Live Render Preview
                          </div>
                          <MarkdownLegalRenderer content={sec.contentMarkdown} />
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={sec.contentMarkdown}
                        onChange={(e) => handleUpdateSection(idx, "contentMarkdown", e.target.value)}
                        rows={8}
                        className="w-full p-3 text-xs font-admin-mono border border-[#CBD5E1] rounded-sm text-[#0F172A] font-mono leading-relaxed"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step-by-Step Publishing Progress Flow Modal ("Slow deliberate UI/UX") */}
      {isPublishingFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-sm shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-5">
            {/* Header Status */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-purple-50 text-[#7C3AED]">
                {publishCompleted ? (
                  <FaCircleCheck className="w-7 h-7 text-emerald-600" />
                ) : (
                  <FaRotate className="w-6 h-6 text-[#7C3AED] animate-spin" />
                )}
              </div>
              <h3 className="text-base font-semibold text-[#0F172A] font-admin">
                {publishCompleted ? "Publication Complete!" : "Publishing Revision..."}
              </h3>
              <p className="text-xs font-admin-mono text-[#64748B]">
                {publishCurrentStep}
              </p>
            </div>

            {/* Smooth Progress Bar */}
            <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  publishCompleted ? "bg-emerald-500" : "bg-[#7C3AED]"
                }`}
                style={{ width: `${publishProgress}%` }}
              />
            </div>

            {/* Step-by-Step Checklist */}
            <div className="space-y-2 text-xs font-admin-mono bg-[#F8FAFC] border border-[#E2E8F0] rounded-sm p-3.5">
              <div
                className={`flex items-center gap-2 ${
                  publishProgress >= 20 ? "text-emerald-700 font-semibold" : "text-[#94A3B8]"
                }`}
              >
                {publishProgress >= 20 ? (
                  <FaCheck className="w-3 h-3 text-emerald-600" />
                ) : (
                  <span className="w-3 h-3 rounded-full border border-[#CBD5E1]" />
                )}
                <span>1. Revision verified (v{version})</span>
              </div>

              <div
                className={`flex items-center gap-2 ${
                  publishProgress >= 45 ? "text-emerald-700 font-semibold" : "text-[#94A3B8]"
                }`}
              >
                {publishProgress >= 45 ? (
                  <FaCheck className="w-3 h-3 text-emerald-600" />
                ) : (
                  <span className="w-3 h-3 rounded-full border border-[#CBD5E1]" />
                )}
                <span>2. Previous version saved to history ledger</span>
              </div>

              <div
                className={`flex items-center gap-2 ${
                  publishProgress >= 70 ? "text-emerald-700 font-semibold" : "text-[#94A3B8]"
                }`}
              >
                {publishProgress >= 70 ? (
                  <FaCheck className="w-3 h-3 text-emerald-600" />
                ) : (
                  <span className="w-3 h-3 rounded-full border border-[#CBD5E1]" />
                )}
                <span>3. Live website updated</span>
              </div>

              <div
                className={`flex items-center gap-2 ${
                  publishProgress >= 100 ? "text-emerald-700 font-semibold" : "text-[#94A3B8]"
                }`}
              >
                {publishProgress >= 100 ? (
                  <FaCheck className="w-3 h-3 text-emerald-600" />
                ) : (
                  <span className="w-3 h-3 rounded-full border border-[#CBD5E1]" />
                )}
                <span>4. Publication finalized &amp; changes synchronized</span>
              </div>
            </div>

            {/* If Completed, show action buttons */}
            {publishCompleted && (
              <div className="space-y-3 pt-2">

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublishingFlow(false);
                      router.push("/admin/legal");
                    }}
                    className="flex-1 py-2 px-3 text-xs font-admin-mono font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-[#FFFFFF] rounded-sm transition-all text-center cursor-pointer shadow-2xs"
                  >
                    Go to Legal Overview
                  </button>
                  <a
                    href={activeDocType === "TERMS" ? "/terms" : "/privacy"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 text-xs font-admin-mono text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] rounded-sm transition-all text-center"
                  >
                    View Live
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsPublishingFlow(false)}
                    className="py-2 px-3 text-xs font-admin-mono text-[#64748B] hover:text-[#0F172A] border border-transparent rounded-sm transition-all cursor-pointer"
                  >
                    Stay in Editor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
