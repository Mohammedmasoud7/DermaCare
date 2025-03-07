document.getElementById('predict-btn').addEventListener('click', () => {
    const inputs = {
        N: document.getElementById('N').value,
        P: document.getElementById('P').value,
        K: document.getElementById('K').value,
        temperature: document.getElementById('temperature').value,
        humidity: document.getElementById('humidity').value,
        ph: document.getElementById('ph').value,
        rainfall: document.getElementById('rainfall').value
    };

    // Store and display the inputs in history
    const historyDisplay = document.getElementById('input-history-display');
    historyDisplay.innerHTML = ''; // Clear previous history

    // Create a box for each input value
    Object.entries(inputs).forEach(([key, value]) => {
        const inputBox = document.createElement('div');
        inputBox.className = 'input-history-item';
        inputBox.innerHTML = `<strong>${key}:</strong> ${value}`;
        historyDisplay.appendChild(inputBox);
    });

    // Make prediction request
    fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
    })
    .then(response => response.json())
    .then(data => {
        // Show/hide sections
        document.getElementById('input-section').classList.remove('visible');
        document.getElementById('output-section').classList.add('visible');
        document.getElementById('chart-section').classList.add('visible');
        document.getElementById('last-predicted-values').classList.add('visible');

        const resultsDiv = document.getElementById('crop-results');
        resultsDiv.innerHTML = ''; // Clear previous results

        let labels = [];
        let values = [];
        data.forEach(item => {
            const cropDiv = document.createElement('div');
            cropDiv.className = 'crop';

            const cropName = document.createElement('h3');
            cropName.textContent = item.crop;

            const cropImage = document.createElement('img');
            cropImage.src = item.image_path;
            cropImage.alt = item.crop;
            cropImage.style.width = '100px';
            cropImage.style.height = '100px';
            cropImage.style.objectFit = 'contain';

            const cropDescription = document.createElement('p');
            cropDescription.textContent = item.description;

            const cropConfidence = document.createElement('p');
            cropConfidence.textContent = `Confidence: ${item.probability}%`;
            cropConfidence.style.color = 'green';

            cropDiv.appendChild(cropName);
            cropDiv.appendChild(cropImage);
            cropDiv.appendChild(cropDescription);
            cropDiv.appendChild(cropConfidence);

            resultsDiv.appendChild(cropDiv);

            // Prepare data for chart
            labels.push(item.crop);
            values.push(item.probability);
        });

        // Display Bar Chart
        const ctx = document.getElementById('crop-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Crop Recommendation Confidence',
                    data: values,
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        // Always clear input fields after prediction
        Object.keys(inputs).forEach(key => {
            document.getElementById(key).value = '';
        });
    })
    .catch(error => {
        console.error('Error:', error);

        // Clear inputs even if there's an error
        Object.keys(inputs).forEach(key => {
            document.getElementById(key).value = '';
        });
    });
});

// Switch to next input field when pressing Enter
document.querySelectorAll('input').forEach((input, index, inputs) => {
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });
});