document.addEventListener('DOMContentLoaded', () => {
  fetch('/public-url')
    .then(response => response.json())
    .then(data => {
      const publicUrl = data.publicUrl || 'http://localhost:3000';
      generateQRCode(publicUrl);
    })
    .catch(error => console.error('Error fetching public URL:', error));

  document.getElementById('generate-button').addEventListener('click', () => {
    const customUrl = document.getElementById('custom-url').value;
    if (customUrl) {
      generateQRCode(customUrl);
    }
  });
});

function generateQRCode(url) {
  const qrCodeContainer = document.getElementById('qr-code');
  qrCodeContainer.innerHTML = '';
  const qrCode = new QRCode(qrCodeContainer, {
    text: url,
    width: 256, // Larger size
    height: 256, // Larger size
  });
}
