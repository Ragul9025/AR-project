# AuraAR - Web-Based Augmented Reality (Artivive Clone)

AuraAR is a self-hosted, web-based augmented reality (WebAR) application that allows creators and admins to link physical artworks (photos/images) with digital overlays (videos). 

When a user scans a registered physical artwork with their device's camera, the corresponding video is overlaid and played directly on top of the artwork in real-time, matching its position, rotation, and scale.

---

## 🚀 Features

*   **Zero-Config Local Setup:** Automatically downloads a high-quality sample artwork, compiled target, and video on first run so you can test immediately.
*   **Immersive WebAR Scanner:** Powered by **MindAR.js** and **A-Frame** for high-performance, browser-based image tracking (no app install required).
*   **Dynamic Aspect Ratio Fitting:** Automatically calculates the aspect ratio of your target images so that the video overlays fit the physical artwork perfectly without stretching.
*   **Admin Dashboard:** Beautiful, dark-mode panel to upload target images, overlay videos, and `.mind` target files, or delete existing ones.
*   **Gallery & Preview Mode:** Users can browse artworks and open a preview to see the target image and video side-by-side (perfect for testing on a single computer!).

---

## 🛠️ Technology Stack

1.  **Frontend AR Engine:**
    *   [MindAR.js](https://github.com/hiukim/mind-ar-js) (Image Tracking)
    *   [A-Frame](https://aframe.io/) (WebVR/WebXR rendering)
2.  **Backend:**
    *   [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) (Web Server)
    *   [Multer](https://github.com/expressjs/multer) (File upload handling)
    *   JSON-based local storage (no database setup required)
3.  **Styling:**
    *   Custom CSS with modern Glassmorphism, Neon gradients, and responsive layouts.

---

## 🏃‍♂️ How to Run Locally

### 1. Install Dependencies
Open your terminal in the project folder and run:
```bash
npm install
```
*(If you are on Windows and get a PowerShell execution policy error, run `cmd /c npm install` instead).*

### 2. Start the Server
Start the local server by running:
```bash
npm start
```

You should see:
```text
==================================================
  Artivive-like WebAR Server running locally!
  URL: http://localhost:3000
==================================================
```

---

## 📸 How to Test the Sample Artwork

To make testing extremely easy, AuraAR automatically downloads a pre-compiled sample artwork when you start the server for the first time.

1.  Open [http://localhost:3000](http://localhost:3000) in your browser.
2.  You will see the **Cyberpunk Portal (Sample)** in the gallery.
3.  Click the **Preview** button. This will show you:
    *   **The Target Image** (on the left)
    *   **The Video Overlay** (on the right)
4.  To test:
    *   **If using a phone:** Open the website on your phone (make sure your phone is connected to the same Wi-Fi network and use your computer's local IP, e.g., `http://192.168.x.x:3000`). Click **Scan** and point your phone's camera at the **Target Image** shown on your computer screen.
    *   **If using a webcam:** Click **Scan** on your computer. Hold your phone displaying the **Target Image** up to your webcam, or print the target image and hold it up.
5.  Watch the video overlay play perfectly on top of the card! Click the floating speaker button at the bottom-right to unmute.

---

## 🎨 How to Upload Your Own Artworks

Adding your own custom AR experiences is simple:

### Step 1: Compile your Target Image
MindAR needs to analyze your image to detect tracking points.
1. Go to the official [MindAR Web Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/).
2. Drag and drop your **Target Image** (JPG or PNG).
3. Once the analysis is complete, click **Export** to download the `.mind` file.

### Step 2: Upload in the Admin Panel
1. Open AuraAR and click **Admin Panel** (or go to [http://localhost:3000/admin.html](http://localhost:3000/admin.html)).
2. Fill in the **Title**, **Artist**, and **Description**.
3. Upload the three required files:
    *   **Target Image** (the original JPG/PNG)
    *   **Target .mind File** (the compiled file from Step 1)
    *   **AR Overlay Video** (the MP4 video you want to play on top of the image)
4. Click **Create AR Experience**.

Your new artwork will immediately appear in the Gallery, ready to be scanned!
