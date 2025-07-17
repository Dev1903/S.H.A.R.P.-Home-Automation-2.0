/* eslint-disable prettier/prettier */
export const sendToServer = async audioPath => {
  const formData = new FormData();
  formData.append('file', {
    uri: `file://${audioPath}`,
    type: 'audio/m4a',
    name: 'voice.m4a',
  });

  const response = await fetch('http://<YOUR ESP IP>/recognize', {
    method: 'POST',
    headers: {'Content-Type': 'multipart/form-data'},
    body: formData,
  });

  return await response.json();
};
