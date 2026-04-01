import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Recording } from '../types';

interface UploadProgress {
  [recordingId: string]: {
    status: 'idle' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
    url?: string;
  };
}

interface CloudStats {
  totalUploads: number;
  totalSize: number;
  lastUpload: number | null;
}

export function useCloudUpload(userId: string | null) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [cloudStats, setCloudStats] = useState<CloudStats>({
    totalUploads: 0,
    totalSize: 0,
    lastUpload: null,
  });

  // Get user-specific bucket path
  const getUserPath = useCallback((filename: string): string => {
    const uid = userId || 'anonymous';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${uid}/${year}/${month}/${filename}`;
  }, [userId]);

  // Upload a single recording
  const uploadRecording = useCallback(async (recording: Recording): Promise<boolean> => {
    if (!recording.blob) {
      console.error('No blob data for recording');
      return false;
    }

    const recordingId = recording.id;
    
    // Update status to uploading
    setUploadProgress(prev => ({
      ...prev,
      [recordingId]: { status: 'uploading', progress: 0 },
    }));

    try {
      const filename = `recording_${recording.timestamp}_${Date.now()}.webm`;
      const filePath = getUserPath(filename);

      // Upload to Supabase Storage with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filePath, recording.blob, {
          contentType: 'video/webm',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(filePath);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('recordings')
        .insert([{
          id: recording.id,
          user_id: userId,
          filename: filePath,
          url: publicUrl,
          size: recording.blob.size,
          duration: recording.duration,
          gps_data: recording.location ? {
            latitude: recording.location.latitude,
            longitude: recording.location.longitude,
            speed: recording.location.speed,
          } : null,
          is_emergency: recording.isEmergency,
          created_at: new Date(recording.timestamp).toISOString(),
        }]);

      if (dbError) {
        // Try to delete the uploaded file if DB insert failed
        await supabase.storage.from('recordings').remove([filePath]);
        throw new Error(dbError.message);
      }

      // Update progress to success
      setUploadProgress(prev => ({
        ...prev,
        [recordingId]: { status: 'success', progress: 100, url: publicUrl },
      }));

      // Update stats
      setCloudStats(prev => ({
        totalUploads: prev.totalUploads + 1,
        totalSize: prev.totalSize + (recording.blob?.size || 0),
        lastUpload: Date.now(),
      }));

      return true;
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadProgress(prev => ({
        ...prev,
        [recordingId]: { 
          status: 'error', 
          progress: 0, 
          error: error.message || 'העלאה נכשלה' 
        },
      }));
      return false;
    }
  }, [userId, getUserPath]);

  // Upload multiple recordings
  const uploadMultiple = useCallback(async (recordings: Recording[]): Promise<{ 
    success: number; 
    failed: number;
    results: { id: string; success: boolean }[];
  }> => {
    const results: { id: string; success: boolean }[] = [];
    let success = 0;
    let failed = 0;

    // Upload one by one to avoid overwhelming the connection
    for (const recording of recordings) {
      // Skip already uploaded
      if (uploadProgress[recording.id]?.status === 'success') {
        results.push({ id: recording.id, success: true });
        success++;
        continue;
      }

      const result = await uploadRecording(recording);
      results.push({ id: recording.id, success: result });
      
      if (result) {
        success++;
      } else {
        failed++;
      }

      // Small delay between uploads
      if (recordings.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { success, failed, results };
  }, [uploadRecording, uploadProgress]);

  // Delete a cloud recording
  const deleteCloudRecording = useCallback(async (recordingId: string, filePath: string): Promise<boolean> => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('recordings')
        .remove([filePath]);

      if (storageError) {
        console.error('Failed to delete from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('recordings')
        .delete()
        .eq('id', recordingId);

      if (dbError) {
        throw dbError;
      }

      // Remove from progress tracking
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[recordingId];
        return updated;
      });

      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }, []);

  // Fetch user's cloud recordings
  const fetchCloudRecordings = useCallback(async (): Promise<any[]> => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch cloud recordings:', error);
      return [];
    }
  }, [userId]);

  // Get upload status for a recording
  const getUploadStatus = useCallback((recordingId: string) => {
    return uploadProgress[recordingId] || { status: 'idle', progress: 0 };
  }, [uploadProgress]);

  // Reset upload status
  const resetUploadStatus = useCallback((recordingId?: string) => {
    if (recordingId) {
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[recordingId];
        return updated;
      });
    } else {
      setUploadProgress({});
    }
  }, []);

  // Format bytes to human readable
  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    uploadProgress,
    cloudStats,
    uploadRecording,
    uploadMultiple,
    deleteCloudRecording,
    fetchCloudRecordings,
    getUploadStatus,
    resetUploadStatus,
    formatSize,
  };
}
