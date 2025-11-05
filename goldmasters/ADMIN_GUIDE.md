# Admin Guide: Viewing Participant Checkout Details

## Quick Start

### Method 1: From Entries Page
1. Navigate to **Admin Dashboard** → **View Entries**
2. Find the participant in the list
3. Click the **"View Details"** button next to their name
4. A modal will open showing all their checkout information

### Method 2: Direct URL
Use this URL pattern directly:
```
http://localhost:3000/admin/entries?highlight=user-{PARTICIPANT_ID}
```

Replace `{PARTICIPANT_ID}` with the actual participant ID.

### Method 3: From Dashboard
1. Navigate to **Admin Dashboard** 
2. Can also access via dashboard with: `?highlight=user-{PARTICIPANT_ID}`

---

## What You'll See in View Details

### 📋 Participant Information
- **Name**: Full name of the participant
- **Phone**: Contact phone number
- **Tickets Purchased**: Total number of tickets purchased

### 🎯 Competition Information
- **Title**: Name of the competition
- **Markers per Ticket**: How many markers this competition requires per ticket
- **Total Submissions**: Number of tickets with submitted markers

### 🎯 Final Judged Coordinates (If Set by Admin)
Shows the official judging result:
- **X Coordinate**: Normalized (0-1) and percentage format
- **Y Coordinate**: Normalized (0-1) and percentage format
- **Closest Marker**: Automatically identifies which participant marker is closest

Distance shown for the closest marker to help identify potential winners.

### 🔍 Marker Submissions

For each submitted ticket, you'll see:
- **Ticket Number**: Which ticket this submission is for
- **Marker Count**: How many markers were placed (e.g., "3 of 3 markers")
- **Submission Time**: When the markers were submitted

Each marker displays:
- **Marker Number**: Position in sequence (Marker 1, 2, 3, etc.)
- **X Coordinate**: 
  - Normalized (0-1): Precise decimal value
  - Percentage: Same value as percentage of image width
- **Y Coordinate**: 
  - Normalized (0-1): Precise decimal value
  - Percentage: Same value as percentage of image height
- **Distance**: How far this marker is from the final judged position

---

## Understanding the Data

### Coordinate System
- **Range**: 0.0000 to 1.0000
- **Origin**: Top-left corner (0, 0)
- **Max Values**: Bottom-right corner (1, 1)

### Examples
- `(0.5000, 0.5000)` = Dead center of image = 50% across, 50% down
- `(0.2500, 0.7500)` = 25% from left, 75% from top
- `(0.0000, 0.0000)` = Top-left corner
- `(1.0000, 1.0000)` = Bottom-right corner

### Distance Interpretation
- **Lower distance = Better**: Marker closer to the judged position
- **Example**: Distance 0.1234 means marker is ~12.34% away from judged point in normalized space
- **Accuracy**: Shown to 4 decimal places for precision

---

## Common Tasks

### Finding the Winner
1. Open View Details for each participant
2. Look for the participant with the **lowest distance** value
3. That participant's marker is closest to the final judged position

### Checking Submission Completeness
1. Look at **Marker Breakdown** section
2. Verify that all tickets show the required number of markers
3. Confirm **Submission Time** shows a valid timestamp

### Verifying Participant Data
1. Cross-reference **Name** and **Phone** with registration records
2. Confirm **Tickets Purchased** matches payment records
3. Verify **Markers per Ticket** matches competition rules

### Comparing Multiple Participants
1. Open View Details for first participant
2. Note down their best marker distance
3. Close modal and open next participant
4. Compare distances to find top performers

---

## Troubleshooting

### Modal Won't Open
- ✅ Verify participant ID is correct in URL
- ✅ Check you're logged in as admin
- ✅ Refresh page and try again

### Data Shows "No markers submitted yet"
- This participant hasn't completed checkout yet
- They may still be placing markers on the competition page
- Check if their tickets are empty

### Missing Coordinates
- Admin hasn't set final judged coordinates yet
- The blue "Final Judged Coordinates" box won't appear
- Go to **Dashboard** → **Enter Judged Coordinates** to add them

### Distance Values Look Wrong
- Verify the **Final Judged Coordinates** have been set
- Without these, distances cannot be calculated
- Once set, distances will update automatically

---

## Tips & Tricks

💡 **Tip 1**: The **Closest Marker** section highlights the winner automatically
💡 **Tip 2**: Coordinates are always between 0 and 1 (normalized format)
💡 **Tip 3**: Percentage = Coordinate × 100 (for easy mental math)
💡 **Tip 4**: Distance is calculated in the same normalized space as coordinates
💡 **Tip 5**: All times shown are in your local timezone

---

## Data Accuracy

✓ All marker data is saved when participants reach checkout  
✓ Coordinates are stored with 4 decimal precision  
✓ Distances calculated using Euclidean distance formula  
✓ All data verified before display  

---

## Support

For issues or questions:
- Check the modal displays data correctly
- Verify admin token is still valid
- Check browser console for error messages
- Refresh page to reload data
- Contact system administrator if problems persist
