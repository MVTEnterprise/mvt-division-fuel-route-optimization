// @ts-nocheck
// Dispatch and order number
import { useEffect } from 'react';

let atlas = null;
let atlas2 = null;

const Home = () => {
  useEffect(() => {
    let map = null;
    let datasource = null;
    let client = null;

    (async () => {
      atlas = await import('azure-maps-control');
      atlas2 = await import('azure-maps-rest');

      map = new atlas.Map('myMap', {
        language: 'en-US',
        authOptions: {
          authType: atlas.AuthenticationType.subscriptionKey,
          subscriptionKey: 'nd0VsJULUxna4HRXZFfUSrvcuAdGZ6Fcgo4brYmOPrI',
        },
      });

      // ! TESTING
      //Wait until the map resources are ready.
      map.events.add('ready', () => {
        //Create a data source and add it to the map.
        datasource = new atlas.source.DataSource();
        map.sources.add(datasource);

        console.log(atlas);
        console.log(atlas2);
        console.log(map);
        console.log(datasource);

        //Add a layer for rendering the route lines and have it render under the map labels.
        map.layers.add(
          new atlas.layer.LineLayer(datasource, null, {
            strokeColor: '#2272B9',
            strokeWidth: 5,
            lineJoin: 'round',
            lineCap: 'round',
          }),
          'labels'
        );

        //Add a layer for rendering point data.
        map.layers.add(
          new atlas.layer.SymbolLayer(datasource, null, {
            iconOptions: {
              image: ['get', 'icon'],
              allowOverlap: true,
            },
            textOptions: {
              textField: ['get', 'title'],
              offset: [0, 1.2],
            },
            filter: ['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']], //Only render Point or MultiPoints in this layer.
          })
        );

        //Create the GeoJSON objects which represent the start and end points of the route.
        var startPoint = new atlas.data.Feature(new atlas.data.Point([-122.130137, 47.644702]), {
          title: 'Redmond',
          icon: 'pin-blue',
        });

        var endPoint = new atlas.data.Feature(new atlas.data.Point([-122.3352, 47.61397]), {
          title: 'Seattle',
          icon: 'pin-round-blue',
        });

        //Add the data to the data source.
        datasource.add([startPoint, endPoint]);

        map.setCamera({
          bounds: atlas.data.BoundingBox.fromData([startPoint, endPoint]),
          padding: 80,
        });

        // console.log('RETYR POLICY TYPE', atlas2.RetryPolicyType);
        //Use MapControlCredential to share authentication between a map control and the service module.
        var pipeline = atlas2.MapsURL.newPipeline(new atlas2.MapControlCredential(map));

        //Construct the RouteURL object
        var routeURL = new atlas2.RouteURL(pipeline);

        console.log('routeURL', routeURL);

        //Start and end point input to the routeURL
        const testPoint = new atlas.data.Feature(new atlas.data.Point([-122.341515, 47.755653]), {
          title: 'Test',
          icon: 'pin-blue',
          visible: true,
        });
        var coordinates = [
          [startPoint.geometry.coordinates[0], startPoint.geometry.coordinates[1]],
          [testPoint.geometry.coordinates[0], testPoint.geometry.coordinates[1]],
          [endPoint.geometry.coordinates[0], endPoint.geometry.coordinates[1]],
        ];

        //Make a search route request
        routeURL.calculateRouteDirections(atlas2.Aborter.timeout(10000), coordinates).then((directions) => {
          //Get data features from response
          var data = directions.geojson.getFeatures();
          datasource.add(data);

          console.log('Datasource', data);
        });
      });
      // ! END TESTING
    })();

    return () => {
      map = null;
    };
  }, []);

  return (
    <div className="m-16">
      {/* Title */}
      <div className="text-3xl mb-4 font-bold">MVT Division Fuel Route Optimization</div>

      {/* Search Header */}
      <div className="rounded border border-slate-200 px-8 py-6 flex gap-4 items-end mb-6">
        {/* Input */}
        <div className="flex flex-col items-start">
          <label className="text-sm mb-1.5">Dispatch number</label>
          <input
            className="border border-slate-300 rounded px-3.5 py-2.5 text-sm focus:outline-none placeholder:text-slate-500"
            type="text"
            placeholder="Enter dispatch number"
          />
        </div>

        {/* Input */}
        <div className="flex flex-col items-start">
          <label className="text-sm mb-1.5">Order number</label>
          <input
            className="border border-slate-300 rounded px-3.5 py-2.5 text-sm focus:outline-none placeholder:text-slate-500"
            type="text"
            placeholder="Enter dispatch number"
          />
        </div>

        <button className="bg-slate-800 text-white px-8 py-2.5 text-sm rounded">Search</button>
      </div>
      <div id="myMap" className="h-[800px] rounded"></div>
    </div>
  );
};

export default Home;
