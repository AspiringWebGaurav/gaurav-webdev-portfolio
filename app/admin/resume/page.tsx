import React from "react";
import { AdminPageContainer, AdminSuspense } from "@/components/admin";
import { getResumeData } from "@/lib/resume/services/resume-data.service";
import { ResumeStudioEditor } from "@/components/admin/resume/ResumeStudioEditor";

export const dynamic = "force-dynamic";

export default async function AdminResumePage() {
  const resumeData = await getResumeData();

  return (
    <AdminPageContainer
      breadcrumb="RESUME STUDIO"
      subtitle="resume.gauravpatil.site Management"
      title="Official Resume Content & Live Studio"
    >
      <AdminSuspense fallbackTitle="Resume Studio">
        <ResumeStudioEditor initialData={resumeData} />
      </AdminSuspense>
    </AdminPageContainer>
  );
}
