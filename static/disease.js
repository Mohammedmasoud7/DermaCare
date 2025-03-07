document.addEventListener('DOMContentLoaded', () => {
    class PDFGenerator {
        constructor() {
            this.downloadButton = document.getElementById('download-pdf');
            if (this.downloadButton) {
                this.initializeEventListeners();
            } else {
                console.error('Download button not found.');
            }
        }

        initializeEventListeners() {
            this.downloadButton.addEventListener('click', () => this.generatePDF());
        }

        generatePDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Add Header with logo and "Agroverse" title
            const logo = new Image();
            logo.src = '/static/logo.png'; // Path to your logo image
            logo.onload = () => {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(26);
                doc.setTextColor(29, 95, 58);
                doc.text('DermaCare Disease Analysis', 30, 20);

                const logoWidth = 16;
                const logoHeight = (logo.height / logo.width) * logoWidth;
                doc.addImage(logo, 'PNG', 10, 10, logoWidth, logoHeight);

                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.5);
                doc.line(10, 30, doc.internal.pageSize.width - 10, 30);

                doc.addImage(logo, 'PNG', 80, 100, 50, 50, undefined, { opacity: 0.1 });
                doc.setTextColor(0);

                // Retrieve prediction from sessionStorage
                const predictionText = sessionStorage.getItem('prediction') || '';
                const lines = this.processTextForPDF(predictionText);

                doc.setFontSize(12);
                const pageWidth = doc.internal.pageSize.width;
                const pageHeight = doc.internal.pageSize.height;
                const margin = 20;
                const lineHeight = 8;
                const maxWidth = pageWidth - margin * 2;
                let yPosition = 40;

                lines.forEach((line) => {
                    if (yPosition + lineHeight > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }

                    if (line.type === 'bold') {
                        doc.setFont('helvetica', 'bold');
                        doc.text(line.text, margin, yPosition);
                        doc.setFont('helvetica', 'normal');
                        yPosition += lineHeight;
                    } else if (line.type === 'bold-bullet') {
                        doc.setFont('helvetica', 'bold');
                        const wrappedHeader = doc.splitTextToSize(line.header, maxWidth - 10);
                        doc.text(`• ${wrappedHeader[0]}:`, margin, yPosition);
                        doc.setFont('helvetica', 'normal');
                        yPosition += lineHeight;

                        if (line.text) {
                            const wrappedText = doc.splitTextToSize(line.text, maxWidth);
                            wrappedText.forEach((wrappedLine) => {
                                doc.text(wrappedLine, margin + 10, yPosition);
                                yPosition += lineHeight;
                            });
                        }
                    } else if (line.type === 'bullet') {
                        doc.setFont('helvetica', 'normal');
                        const wrappedLines = doc.splitTextToSize(`• ${line.text}`, maxWidth);
                        wrappedLines.forEach((wrappedLine) => {
                            doc.text(wrappedLine, margin, yPosition);
                            yPosition += lineHeight;
                        });
                    } else if (line.type === 'normal') {
                        const wrappedLines = doc.splitTextToSize(line.text, maxWidth);
                        wrappedLines.forEach((wrappedLine) => {
                            doc.text(wrappedLine, margin, yPosition);
                            yPosition += lineHeight;
                        });
                    }
                });

                doc.save('disease-analysis.pdf');
            };
        }

        // Method to process the prediction text for PDF
        processTextForPDF(text) {
            return text.split('\n').map((line) => {
                if (/^\*\*.*\*\*$/.test(line)) {
                    return { type: 'bold', text: line.replace(/\*\*/g, '').trim() };
                } else if (/^\*\*.*\*\*:/.test(line)) {
                    return { type: 'bold', text: line.replace(/\*\*/g, '').trim() };
                } else if (/^\* \*\*.*\*\*:/.test(line)) {
                    const match = line.match(/^\* \*\*(.*?)\*\*:(.*)$/);
                    return {
                        type: 'bold-bullet',
                        header: match[1].trim(),
                        text: match[2]?.trim(),
                    };
                } else if (/^\* .+/.test(line)) {
                    return { type: 'bullet', text: line.replace(/^\* /, '').trim() };
                }
                return { type: 'normal', text: line.trim() };
            });
        }
    }

    new PDFGenerator();

    // Handle image preview after selecting a file
    const imageInput = document.getElementById('image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');

    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'block'; // Show the preview container
            };
            reader.readAsDataURL(file);
        }
    });

    // AJAX submission of the form
    const form = document.getElementById('upload-form');
    form.addEventListener('submit', function (event) {
        event.preventDefault();  // Prevent the form from submitting normally

        const formData = new FormData(form);

        fetch('/analyze', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.prediction) {
                // Store the prediction in sessionStorage
                sessionStorage.setItem('prediction', data.prediction);

                // Display the result section
                document.querySelector('.result').style.display = 'block';

                // Process the prediction for the webpage display (only relevant content)
                const webPrediction = processForWeb(data.prediction);
                document.getElementById('prediction').innerHTML = webPrediction;

                // Hide the image preview after prediction (do not show result image)
                imagePreviewContainer.style.display = 'none';

                // Show the download PDF button
                document.querySelector('.buttons').style.display = 'block';
            } else {
                console.error('Error:', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    // Function to process prediction for webpage display (converts markdown-like syntax to HTML)
    function processForWeb(predictionText) {
        // Find the index of the headings to use as delimiters
        const diseaseNameStart = predictionText.indexOf('Disease Name:\n') + 'Disease Name:'.length;
        const diseaseIdentifiedStart = predictionText.indexOf('Disease Identified:\n') + 'Disease Identified:'.length;
        const impactAssessmentStart = predictionText.indexOf('Impact Assessment:');
        const treatmentMethodStart = predictionText.indexOf('Treatment Method:\n') + 'Treatment Method:'.length;
        const preventionMethodStart = predictionText.indexOf('Prevention Method:\n');

        // Extract relevant content between specific keywords
        const diseaseNameContent = predictionText.slice(diseaseNameStart, diseaseIdentifiedStart).trim();
        const diseaseIdentifiedContent = predictionText.slice(diseaseIdentifiedStart, impactAssessmentStart).trim();
        const treatmentMethodContent = predictionText.slice(treatmentMethodStart, preventionMethodStart).trim();

        // Format content for display (DO NOT include headings but keep them bold)
        let formattedText = `        
            <strong>Disease Name:</strong> ${removeMarkdown(diseaseNameContent)}<br>
            <strong>Disease Identified:</strong> ${removeMarkdown(diseaseIdentifiedContent)}<br><br>
            <strong>Treatment Method:</strong><p>${removeMarkdown(treatmentMethodContent)}</p>
        `;

        return formattedText;
    }

    // Function to remove markdown formatting (like **, *, etc.)
    function removeMarkdown(text) {
        // Remove all markdown-like syntax (bold, italic, etc.)
        return text.replace(/\*|_/g, '').replace(/\*\*(.*?)\*\*/g, '$1').trim();
    }
});
