window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav');
    
    // Get the position and height of the navbar
    const navRect = nav.getBoundingClientRect();
    
    // Calculate the area beneath the navbar (visible area within the viewport)
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Create a canvas to grab pixel data from the page below the navbar
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height - navRect.bottom; // Height below the navbar
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(document.documentElement, 0, -navRect.bottom, width, height - navRect.bottom);
    
    // Get pixel data from the canvas
    const imageData = ctx.getImageData(0, 0, width, height - navRect.bottom);
    const data = imageData.data;
    
    let matchCount = 0;
    const totalPixels = data.length / 4; // 4 values per pixel (RGBA)
    
    // Check for rgb(42, 127, 79) in the pixel data
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // If the pixel is rgb(42, 127, 79) (or close to it), increment matchCount
      if (r === 42 && g === 127 && b === 79) {
        matchCount++;
      }
    }
    
    // Calculate the percentage of matching pixels
    const matchPercentage = (matchCount / totalPixels) * 100;
    
    // If 1% or more of the area has rgb(42, 127, 79), make the navbar white
    if (matchPercentage >= 1) {
      nav.style.background = 'rgba(255, 255, 255, 1)'; // White background
    } else {
      nav.style.background = 'rgba(255, 255, 255, 0.7)'; // Semi-transparent
    }
  });
  