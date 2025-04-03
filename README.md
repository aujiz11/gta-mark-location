# GTA San Andreas - Mark/Find Location
Find and mark locations on the entire GTA San Andreas map

## Features

- **Interactive Map Navigation**: Pan and zoom functionality with mouse and touch support
- **Location Search**: Find locations by name using the search function
- **Coordinate Marking**: Place markers at specific GTA San Andreas world coordinates
- **Location Details**: View detailed information about locations including exact coordinates and boundaries
- **Responsive Design**: Works on both desktop and mobile devices
- **Touch Support**: Multi-touch gestures for zooming and panning on touch devices

## Demo

[Live Demo](https://aujiz11.github.io/gta-mark-location/)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aujiz11/gta-mark-location.git
   ```

2. Navigate to the project folder:
   ```bash
   cd gta-mark-location
   ```

3. Open `index.html` in your browser or use a local server


## Usage

### Finding a Location by Name
1. Use the search box to filter locations by name
2. Select a location from the dropdown list
3. The map will automatically center on the selected location with a marker

### Finding a Location by Coordinates
1. Enter the X, Y, and Z coordinates in the input fields
2. Click "Mark location" or press Enter
3. The map will display the marker at the specified coordinates
4. If the coordinates are within a known location, its details will be shown

### Map Navigation
- **Pan**: Click and drag or use touch gestures
- **Zoom**: Use mouse wheel, pinch gesture, or the zoom buttons
- **Reset View**: Click the reset button (arrows icon) to return to the default view
- **Quick Zoom**: Double-click on any point to zoom in

## How It Works

The application converts GTA San Andreas world coordinates (-3000 to 3000 on X and Y axes) to map pixel coordinates. Location data is loaded from a JSON file containing names and boundary information for various in-game locations.

Key technical components:

- `convertToMapCoords` function maps GTA coordinates to screen coordinates
- `findLocationByCoords` checks if given coordinates fall within known location boundaries
- `zoomAtPoint` handles the complex math for zooming at a specific point

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Font Awesome

## Location Data

Location data is stored in `assets/json/location.json` and includes:
- Location name
- Boundaries (minimum and maximum X, Y, Z coordinates)

You can modify this file to add or update locations.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/aujiz11/gta-mark-location/blob/main/LICENSE) file for details.

## Acknowledgements

- Map images taken from **GTAALL.COM** website
- Inspired by many GTA map projects in the modding community