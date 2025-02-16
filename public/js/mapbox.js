/* eslint-disable */

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2FuamVldDIwMDIiLCJhIjoiY203M2RmZ2JsMGZ2MzJycXozODV0cHM4byJ9.TxFZf_uT2BHkxCzUte80Og';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    //   center: [-118.113491, 34.111745], // starting position [lng, lat]. Note that lat must be set between -90 and 90
    //   zoom: 9, // starting zoom
    style: 'mapbox://styles/sanjeet2002/cm73ey3g501oq01r58kp028zb',
    interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
