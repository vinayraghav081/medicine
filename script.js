function toggleMenu() {
    const sidebarMenu = document.getElementById('sidebarMenu');
    sidebarMenu.classList.toggle('active');
}

// Close the sidebar if the user clicks outside of it
document.addEventListener('click', function(event) {
    const sidebarMenu = document.getElementById('sidebarMenu');
    const menuIcon = document.querySelector('.menu-icon');

    if (sidebarMenu.classList.contains('active') && !sidebarMenu.contains(event.target) && !menuIcon.contains(event.target)) {
        sidebarMenu.classList.remove('active');
    }
});

let allFilteredMedicines = []; // To store all filtered results

document.addEventListener("DOMContentLoaded", function() {
    setActiveSection("scan"); // Set "Home" as the default active section
});

function searchMedicine() {
    const searchBar = document.getElementById('search-bar').value.toLowerCase();
    const results = document.getElementById('search-results');
    const showAllButton = document.getElementById('show-all-button');
    
    results.innerHTML = ''; // Clear previous results
    showAllButton.style.display = 'none'; // Hide the "Show All" button initially

    // Filter the medicine data to find matches in name or description
    allFilteredMedicines = medicineData.filter(med => 
        med.name.toLowerCase().includes(searchBar) || 
        med.description.toLowerCase().includes(searchBar)
    );

    // Display the first 10 results
    const displayedMedicines = allFilteredMedicines.slice(0, 10);

    if (displayedMedicines.length > 0) {
        displayedMedicines.forEach(med => {
            results.innerHTML += `
                <div class="medicine-result">
                    <h3>${med.name}</h3>
                    <p>${med.description}</p>
                    <p><strong>Max Dosage:</strong> ${med.max_dosage}</p>
                </div>
                <hr>
            `;
        });

        if (allFilteredMedicines.length > 10) {
            showAllButton.style.display = 'block'; // Show the "Show All" button if more than 10 results
        }
    } else {
        results.innerHTML = `<p>No medicine found matching your search.</p>`;
    }
}

function showAllResults() {
    const results = document.getElementById('search-results');
    results.innerHTML = ''; // Clear previous results

    allFilteredMedicines.forEach(med => {
        results.innerHTML += `
            <div class="medicine-result">
                <h3>${med.name}</h3>
                <p>${med.description}</p>
                <p><strong>Max Dosage:</strong> ${med.max_dosage}</p>
            </div>
            <hr>
        `;
    });

    document.getElementById('show-all-button').style.display = 'none'; // Hide the "Show All" button after showing all results
}


function setActiveSection(sectionId) {
    document.getElementById("home").style.display = "none";
    document.getElementById("scan").style.display = "none";
    document.getElementById("search").style.display = "none";
    document.getElementById("retailer").style.display = "none";

    document.querySelectorAll('nav ul li').forEach(item => item.classList.remove('active'));

    document.getElementById(sectionId).style.display = "block";

    document.querySelector(`#head-${sectionId}`).classList.add('active');
}

document.getElementById("head-home").addEventListener("click", function() {
    setActiveSection("home");
});

document.getElementById("head-scan").addEventListener("click", function() {
    setActiveSection("scan");
});

document.getElementById("head-search").addEventListener("click", function() {
    setActiveSection("search");
});

document.getElementById("head-retailer").addEventListener("click", function() {
    setActiveSection("retailer");
});

document.getElementById("head-about").addEventListener("click", function() {
    setActiveSection("about");
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', function() {
    const scrollToTopButton = document.getElementById('scroll-to-top');
    
    if (window.scrollY > 50) {
        scrollToTopButton.style.display = 'block'; // Show the button
    } else {
        scrollToTopButton.style.display = 'none'; // Hide the button
    }
});

let stream;

document.getElementById('start-camera').addEventListener('click', function() {
    if (stream) {
        // If the camera is already running, stop it and reset
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        resetUI();
        return;
    }

    const video = document.getElementById('camera-stream');
    const qrResult = document.getElementById('qr-result');
    const qrContent = document.getElementById('qr-content');
    const qrStatus = document.getElementById('qr-status');
    const canvas = document.getElementById('qr-canvas');
    const context = canvas.getContext('2d');

    video.style.display = 'block'; // Show the video element

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(newStream) {
            video.srcObject = newStream;
            stream = newStream; // Save the stream to stop it later
            scanQRCode();
        })
        .catch(function(err) {
            console.error("Error accessing the camera: ", err);
            alert("Could not access the camera. Please make sure your device has a camera and that you have granted permission.");
        });

    function scanQRCode() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height, { willReadFrequently: true });
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

            if (qrCode) {
                const qrData = qrCode.data;
                processQRCodeData(qrData);
            } else {
                requestAnimationFrame(scanQRCode);
            }
        } else {
            requestAnimationFrame(scanQRCode);
        }
    }
});

async function processQRCodeData(qrData) {
    const repoOwner = 'Mohit1465';
    const repoName = 'ELEN.github.io';
    const filePath = 'data.js';
    const token = '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';

    const qrResult = document.getElementById('qr-result');
    const qrContent = document.getElementById('qr-content');
    const qrStatus = document.getElementById('qr-status');
    
    if (!qrResult || !qrContent || !qrStatus) {
        console.error('QR result elements are missing in the DOM.');
        return;
    }

    try {
        // Fetch the data from GitHub
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        const data = await response.json();
        const fileContent = atob(data.content); // Decode base64 content
        const jsonData = JSON.parse(fileContent); // Convert to JavaScript object

        // Check if the QR data exists
        const status = jsonData[qrData];
        
        if (status === 'unscanned') {
            jsonData[qrData] = 'scanned';
            await updateData(jsonData);
            qrStatus.innerText = 'QR code matched and marked as scanned.';
        } else if (status === 'scanned') {
            qrStatus.innerText = 'QR code has already been scanned.';
        } else {
            qrStatus.innerText = 'QR code not found in the data.';
        }

        // Display the QR content
        qrContent.innerText = qrData;
        
        // Show the QR result
        qrResult.style.display = 'block';
        
        // Stop the camera
        const video = document.getElementById('camera-stream');
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }

    } catch (error) {
        console.error('Error processing QR code data:', error);
        alert('Error processing QR code data.');
    }
}

async function updateData(updatedData) {
    const repoOwner = 'Mohit1465';
    const repoName = 'ELEN.github.io';
    const filePath = 'data.js';
    const token = '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';

    try {
        // Get the current file's sha
        const getResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        const getData = await getResponse.json();
        const sha = getData.sha;

        // Update the file content
        await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Update QR code data',
                content: btoa(JSON.stringify(updatedData)), // Encode to base64
                sha: sha
            })
        });
    } catch (error) {
        console.error('Error updating data:', error);
        alert('Error updating data.');
    }
}

function resetUI() {
    const video = document.getElementById('camera-stream');
    const qrResult = document.getElementById('qr-result');
    const qrContent = document.getElementById('qr-content');
    const qrStatus = document.getElementById('qr-status');

    video.style.display = 'none'; // Hide the video element
    qrResult.style.display = 'none'; // Hide the QR result
    qrContent.innerText = ''; // Clear QR content
    qrStatus.innerText = ''; // Clear QR status
}
