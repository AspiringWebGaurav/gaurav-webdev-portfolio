'use client';

import React, { useEffect, useState } from 'react';
import { Upload, Download, Trash2, Check } from 'lucide-react';
import { showToast } from "@/lib/toast";

import { ResumeVersion } from '@/types/bubble';

export default function BubbleResumeManagement() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, []);

  async function fetchVersions() {
    try {
      const response = await fetch('/api/bubble/resume');
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Failed to fetch resume versions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      showToast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/bubble/resume', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fetchVersions();
      } else {
        showToast.error('Failed to upload resume');
      }
    } catch (error) {
      console.error('Failed to upload resume:', error);
      showToast.error('Failed to upload resume');
    } finally {
      setUploading(false);
    }
  }

  async function handleSetCurrent(id: string) {
    try {
      await fetch('/api/bubble/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchVersions();
    } catch (error) {
      console.error('Failed to set current resume:', error);
    }
  }

  async function handleDelete(id: string) {
    showToast.info("Deleting resume...", "Deleting", { autoClose: 2000 });

    try {
      await fetch(`/api/bubble/resume?resumeId=${id}`, { method: 'DELETE' });
      fetchVersions();
    } catch (error) {
      console.error('Failed to delete resume:', error);
      showToast.error('Failed to delete resume');
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Resume Management</h2>
          <p className="text-gray-600 text-sm mt-1">Upload and manage resume versions</p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Resume'}</span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No resume uploaded yet</div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                version.isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{version.fileName}</h4>
                    {version.isCurrent && (
                      <span className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        <Check className="w-3 h-3" />
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Version {version.version}</span>
                    <span>•</span>
                    <span>{formatFileSize(version.fileSize)}</span>
                    <span>•</span>
                    <span>{new Date(version.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {!version.isCurrent && (
                    <button
                      onClick={() => handleSetCurrent(version.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Set as current"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <a
                    href={version.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(version.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
