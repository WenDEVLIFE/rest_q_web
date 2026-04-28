# How the Intelligence System Works: A Step-by-Step Guide

This guide explains the exact process I followed to build the Rest-Q intelligence engine. It shows how the software takes a simple map location and turns it into a smart prediction.

---

### Step 1: Pinning the Location
The process starts when I capture the exact Latitude and Longitude from a map pin or a user report. I take these coordinates and match them against my KML road models to identify exactly which street segment is being looked at. Finally, I use the Nominatim engine to turn those raw numbers into a real street name like "MacArthur Highway" so it makes sense in the logs.

---

### Step 2: Running the Math and Data Fusion
Once the location is set, I trigger the AI calculations to find the true Response Time. I start by looking at the historical baseline, using the trained weights from the ML panel to see how that road usually behaves. I then overlay this with actual real-time telemetry from live sensors to see what is happening right now. 

To refine this further, I factor in the time of day for rush hour, check for weather impacts via the Pagasa API, and look for any active accidents nearby. I reprocess all this mixed data (History + Live) using the TSRE formula to generate the final arrival time that the user sees on their screen.

---

### Step 3: Evaluating the Risk and Hotspots
At the same time, I run a risk check to see if the area is safe. I look at the history of accidents in that spot and check if current traffic speeds are fluctuating or dropping too fast. If I detect that four or more reports have come in from the same 500-meter area, I automatically group them into a "Critical Hotspot" so commanders can see where the real trouble is.

---

### Step 4: Showing Clear Results
The last step is making the data easy to use. I turn the complex numbers into the simple Red, Yellow, and Green lines you see on the map. I also take all the chaotic incident reports and summarize them into a clean Situation Report for the operators. To make sure the system is transparent, I included a "View ML Proof" feature that explains exactly why the AI added extra minutes—like if there’s a flood or a roadblock—so the user knows the prediction is based on real facts.

---
*By: Rest-Q Development Team*
