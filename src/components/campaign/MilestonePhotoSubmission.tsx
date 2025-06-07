import { useState, useRef } from 'react';
import { Camera, MapPin, Upload, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface MilestonePhotoSubmissionProps {
  campaignId: string;
  milestoneId: string;
  milestoneTitle: string;
  onSubmissionComplete: (txHash: string) => void;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export function MilestonePhotoSubmission({
  campaignId,
  milestoneId,
  milestoneTitle,
  onSubmissionComplete
}: MilestonePhotoSubmissionProps) {
  const { submitMilestoneProof, isLoading } = useStore();
  
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUsingCamera, setIsUsingCamera] = useState(false);

  const captureLocation = async () => {
    setIsCapturingLocation(true);
    
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const geoData: GeoLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: Date.now(),
        accuracy: position.coords.accuracy
      };

      setGeoLocation(geoData);
      toast.success('Location captured successfully');
    } catch (error) {
      console.error('Error capturing location:', error);
      toast.error('Failed to capture location. Please enable location services.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsUsingCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(photoData);
        
        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setIsUsingCamera(false);
        
        // Auto-capture location when photo is taken
        captureLocation();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhoto(result);
        // Auto-capture location when file is uploaded
        captureLocation();
      };
      reader.readAsDataURL(file);
    }
  };

  const submitProof = async () => {
    if (!photo) {
      toast.error('Please capture or upload a photo');
      return;
    }

    if (!geoLocation) {
      toast.error('Please capture your location');
      return;
    }

    if (!description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    setSubmissionStatus('uploading');

    try {
      const photoProof = {
        imageData: photo,
        geoTag: geoLocation,
        description: description.trim()
      };

      const txHash = await submitMilestoneProof(campaignId, milestoneId, photoProof);
      
      setSubmissionStatus('success');
      toast.success('Milestone proof submitted successfully!');
      
      // Reset form
      setPhoto(null);
      setDescription('');
      setGeoLocation(null);
      
      onSubmissionComplete(txHash);
      
    } catch (error) {
      setSubmissionStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to submit proof');
    }
  };

  const resetForm = () => {
    setPhoto(null);
    setDescription('');
    setGeoLocation(null);
    setSubmissionStatus('idle');
    
    // Stop camera if active
    if (isUsingCamera && videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsUsingCamera(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Submit Milestone Proof
        </CardTitle>
        <p className="text-sm text-gray-600">
          {milestoneTitle}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Photo Capture/Upload Section */}
        <div className="space-y-4">
          <Label>Photo Evidence</Label>
          
          {!photo && !isUsingCamera && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={startCamera} variant="outline" className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline" 
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {isUsingCamera && (
            <div className="space-y-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border"
              />
              <div className="flex gap-2">
                <Button onClick={capturePhoto} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                <Button onClick={() => setIsUsingCamera(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {photo && (
            <div className="space-y-3">
              <img 
                src={photo} 
                alt="Milestone proof" 
                className="w-full rounded-lg border max-h-64 object-cover"
              />
              <Button onClick={() => setPhoto(null)} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Remove Photo
              </Button>
            </div>
          )}
        </div>

        {/* Location Section */}
        <div className="space-y-3">
          <Label>Location Verification</Label>
          
          {!geoLocation ? (
            <Button 
              onClick={captureLocation} 
              disabled={isCapturingLocation}
              variant="outline"
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isCapturingLocation ? 'Capturing Location...' : 'Capture Current Location'}
            </Button>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Location Captured</span>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <div>Lat: {geoLocation.latitude.toFixed(6)}</div>
                <div>Lng: {geoLocation.longitude.toFixed(6)}</div>
                <div>Time: {new Date(geoLocation.timestamp).toLocaleString()}</div>
                {geoLocation.accuracy && (
                  <div>Accuracy: ±{Math.round(geoLocation.accuracy)}m</div>
                )}
              </div>
              <Button 
                onClick={() => setGeoLocation(null)} 
                variant="ghost" 
                size="sm"
                className="mt-2"
              >
                Recapture Location
              </Button>
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the milestone completion and what the photo shows..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submission Status */}
        {submissionStatus !== 'idle' && (
          <div className="space-y-2">
            <Badge 
              variant={
                submissionStatus === 'success' ? 'default' : 
                submissionStatus === 'error' ? 'destructive' : 
                'secondary'
              }
            >
              {submissionStatus === 'uploading' && 'Uploading to IPFS and XRPL...'}
              {submissionStatus === 'success' && 'Successfully Submitted!'}
              {submissionStatus === 'error' && 'Submission Failed'}
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={submitProof}
            disabled={!photo || !geoLocation || !description.trim() || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Submitting...' : 'Submit Proof'}
          </Button>
          
          {(photo || geoLocation || description) && (
            <Button onClick={resetForm} variant="outline">
              Reset
            </Button>
          )}
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
} 