// Dispatch and order number
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

type azureMapControlImport = typeof import('azure-maps-control');
type AzureMapRestImport = typeof import('azure-maps-rest');

type MapInstance = import('azure-maps-control').Map;
type AzureMapDataSource = import('azure-maps-control').source.DataSource;
type MapPopup = import('azure-maps-control').Popup;

let azureMapsControl: azureMapControlImport | null = null;
let azureMapsRest: AzureMapRestImport | null = null;

const Home = () => {
  const mapInstance = useRef<MapInstance | null>(null);
  const mapElementReference = useRef<HTMLDivElement | null>(null);
  const mapDatasource = useRef<AzureMapDataSource | null>(null);
  const mapPopups = useRef<Array<MapPopup>>([]);
  const [isMapReferenceVisible, setIsMapReferenceVisible] = useState(false);

  const getFuelSolution = async () => {
    interface FuelSolutionResponse {
      FuelSolution: {
        Destination: {
          StopCode: string;
          Latitude: number;
          Longitude: number;
        };
        Origin: {
          StopCode: string;
          Latitude: number;
          Longitude: number;
        };
        FuelRoute: Array<{
          StationId: string;
          Address: string;
          Latitude: number;
          Longitude: number;
          RefuelAmount: number;
        }>;
      };
      Message: string | null;
      Success: boolean;
    }

    let { data: fuelSolutionResponse } = await axios.post<FuelSolutionResponse>(
      'https://devmvtapi.azurewebsites.net/api/fuelSolution?code=3odXM83jcj28XotLRq1MrqoyxU3y1UtZmABMEsvxheBuAzFuVdjjJw==',
      {
        DispatchKey: 2,
      }
    );

    fuelSolutionResponse.FuelSolution.Origin.Latitude = 31.7619;
    fuelSolutionResponse.FuelSolution.Origin.Longitude = -106.485;

    fuelSolutionResponse.FuelSolution.Destination.Latitude = 33.9569444;
    fuelSolutionResponse.FuelSolution.Destination.Longitude = -118.0661111;

    fuelSolutionResponse.FuelSolution.FuelRoute = [
      { StationId: '1', Address: 'Address one', Latitude: 31.327761, Longitude: -109.546883, RefuelAmount: 100 },
      { StationId: '2', Address: 'Address two', Latitude: 31.32568, Longitude: -110.945778, RefuelAmount: 75 },
    ];

    if (azureMapsControl === null) throw Error('Azure maps control paackage not imported');

    if (azureMapsRest === null) throw Error('Azure maps rest package not imported');

    if (mapInstance.current === null) throw Error('Map instance not created');

    mapPopups.current.forEach((popup) => popup.remove());
    mapDatasource.current = null;

    //Wait until the map resources are ready.
    mapInstance.current!.events.add('ready', () => {
      //Create a data source and add it to the map.
      mapDatasource.current = new azureMapsControl!.source.DataSource();
      mapInstance.current!.sources.add(mapDatasource.current);

      //Add a layer for rendering the route lines and have it render under the map labels.
      mapInstance.current!.layers.add(
        new azureMapsControl!.layer.LineLayer(mapDatasource.current, undefined, {
          strokeColor: '#2272B9',
          strokeWidth: 5,
          lineJoin: 'round',
          lineCap: 'round',
        }),
        'labels'
      );

      //Add a layer for rendering point data.
      mapInstance.current!.layers.add(
        new azureMapsControl!.layer.SymbolLayer(mapDatasource.current, undefined, {
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
      var startPoint = new azureMapsControl!.data.Feature(
        new azureMapsControl!.data.Point([
          fuelSolutionResponse.FuelSolution.Origin.Longitude,
          fuelSolutionResponse.FuelSolution.Origin.Latitude,
        ]),
        {
          title: fuelSolutionResponse.FuelSolution.Origin.StopCode,
          icon: 'pin-round-blue',
        }
      );

      var endPoint = new azureMapsControl!.data.Feature(
        new azureMapsControl!.data.Point([
          fuelSolutionResponse.FuelSolution.Destination.Longitude,
          fuelSolutionResponse.FuelSolution.Destination.Latitude,
        ]),
        {
          title: fuelSolutionResponse.FuelSolution.Destination.StopCode,
          icon: 'pin-blue',
        }
      );

      // My comment - loop and create waypoints
      const wayPoints = fuelSolutionResponse.FuelSolution.FuelRoute.map((fuelStop) => {
        // Waypoint
        return new azureMapsControl!.data.Feature(
          new azureMapsControl!.data.Point([fuelStop.Longitude, fuelStop.Latitude]),
          {
            title: fuelStop.Address,
            icon: 'pin-red',
          }
        );
      });

      //Add the data to the data source.
      mapDatasource.current.add([startPoint, ...wayPoints, endPoint]);

      mapInstance.current!.setCamera({
        bounds: azureMapsControl!.data.BoundingBox.fromData([startPoint, endPoint]),
        padding: 80,
      });

      //Use MapControlCredential to share authentication between a map control and the service module.
      var pipeline = azureMapsRest!.MapsURL.newPipeline(new azureMapsRest!.MapControlCredential(mapInstance.current!));

      //Construct the RouteURL object
      var routeURL = new azureMapsRest!.RouteURL(pipeline);

      //Start and end point input to the routeURL

      var coordinates = [
        [startPoint.geometry.coordinates[0], startPoint.geometry.coordinates[1]],
        ...wayPoints.map((wayPoint) => [wayPoint.geometry.coordinates[0], wayPoint.geometry.coordinates[1]]),
        [endPoint.geometry.coordinates[0], endPoint.geometry.coordinates[1]],
      ];

      //Make a search route request
      routeURL.calculateRouteDirections(azureMapsRest!.Aborter.timeout(10000), coordinates).then((directions) => {
        //Get data features from response
        var data = directions.geojson.getFeatures();
        mapDatasource.current!.add(data);
      });

      mapPopups.current = fuelSolutionResponse.FuelSolution.FuelRoute.map((fuelStop) => {
        return new azureMapsControl!.Popup({
          pixelOffset: [0, -18],
          closeButton: false,
          position: [fuelStop.Longitude, fuelStop.Latitude],
          content: `
            <div class="bg-red-500 rounded px-3 py-2"> 
              <div class="text-white font-bold text-sm">Purchase ${fuelStop.RefuelAmount} gallons</div> 
            </div>
          `,
        });
      });

      mapPopups.current.forEach((popup) => popup.open(mapInstance.current!));
    });
  };

  useEffect(() => {
    if (!isMapReferenceVisible) return;

    const mapReferenceElementCopy = mapElementReference.current;

    const initializeAzureMapsControl = async () => {
      azureMapsControl = await import('azure-maps-control');
    };

    const initializeAzureMapsRest = async () => {
      azureMapsRest = await import('azure-maps-rest');
    };

    const initializeAzureResources = async () => {
      azureMapsControl === null && (await initializeAzureMapsControl());
      azureMapsRest === null && (await initializeAzureMapsRest());

      if (azureMapsControl === null) throw Error('Azure maps control not imported');

      mapInstance.current = new azureMapsControl.Map('myMap', {
        language: 'en-US',
        authOptions: {
          authType: azureMapsControl.AuthenticationType.subscriptionKey,
          subscriptionKey: 'nd0VsJULUxna4HRXZFfUSrvcuAdGZ6Fcgo4brYmOPrI',
        },
      });
    };

    initializeAzureResources();

    return () => {
      mapPopups.current.forEach((popup) => popup.remove());
      mapReferenceElementCopy!.innerHTML = '';
    };
  }, [isMapReferenceVisible]);

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

        <button className="bg-slate-800 text-white font-medium px-8 py-2.5 text-sm rounded" onClick={getFuelSolution}>
          Optimize ⛽
        </button>
      </div>

      <div
        ref={(el) => {
          mapElementReference.current = el;
          setIsMapReferenceVisible(true);
        }}
        id="myMap"
        className="h-[800px] rounded"
      ></div>
    </div>
  );
};

export default Home;
