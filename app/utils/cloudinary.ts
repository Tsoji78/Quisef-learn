export const uploadToCloudinary = async (
  file: File,
  resourceType: 'image' | 'video'
): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Validation
  if (!cloudName || cloudName === 'undefined') {
    console.error('Cloudinary cloud name is missing or undefined');
    throw new Error('Cloudinary cloud name is not configured. Please check your environment variables.');
  }

  if (!uploadPreset || uploadPreset === 'undefined') {
    console.error('Cloudinary upload preset is missing or undefined');
    throw new Error('Cloudinary upload preset is not configured. Please check your environment variables.');
  }

  // Debug logging (remove after fixing)
  console.log('Cloudinary Config:', {
    cloudName,
    uploadPreset,
    resourceType,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  // DO NOT append cloud_name to formData - it goes in the URL only

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  
  console.log('Upload URL:', uploadUrl);

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cloudinary upload failed:', data);
      throw new Error(
        data.error?.message || 
        `Cloudinary upload failed: ${response.statusText}`
      );
    }

    console.log('Upload successful:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(
      `Cloudinary upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};