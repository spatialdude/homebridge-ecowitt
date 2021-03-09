import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
//import { EcowittPlatformAccessory } from './platformAccessory';
import { WH25, WH65, WH57, EcowittPlatformAccessory } from './platformAccessory';

import * as restify from 'restify';
import * as crypto from 'crypto';
import { timeStamp } from 'node:console';

const SensorClasses = {
  WH25: EcowittPlatformAccessory,
  WH65: EcowittPlatformAccessory,
  WH57: EcowittPlatformAccessory,
};

const SensorInfos = {
  WH25: {
    name: 'WH25',
    displayName: 'Indoor temperature, humidity & pressure sensor',
  },
  WH65: {
    name: 'WH65',
    displayName: 'Outdor 7 in 1 sensor group',
  },
  WH57: {
    name: 'WH57',
    displayName: 'Lightning sensor',
  },
};

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class EcowittHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public wxDataReportServer: restify.Server;
  public wxDataReport = null;

  public wxStationInfo = {
    manufacturer: 'Ecowitt',
    model: '',
    serialNumber: this.config.mac,
    softwareRevision: '',
    frequency: '',
    PASSKEY: crypto
      .createHash('md5')
      .update(this.config.mac)
      .digest('hex').toUpperCase(),
    sensors: [],
    sensorInstances: {},
  };

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {

    this.wxDataReportServer = restify.createServer();
    this.wxDataReportServer.use(restify.plugins.bodyParser());

    this.log.info('Data report path:', this.config.path);
    this.log.info('Data report port:', this.config.port);

    this.wxDataReportServer.post(
      this.config.path,
      (req, res, next) => {
        this.log.info('Data source address:', req.socket.remoteAddress);
        this.log.info('Request:', req.toString());
        this.wxDataReportReport(req.body);
        next();
      });


    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      this.wxDataReportServer.listen(this.config.port, () => {
        this.log.info('Listening at %s', this.wxDataReportServer.url);
      });
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }


  wxDataReportReport(dataReport) {
    if (dataReport.PASSKEY !== this.wxStationInfo.PASSKEY) {
      this.log.error('Report not for this station:', JSON.stringify(dataReport, undefined, 2));
      return;
    }

    this.log.info('Data report:', JSON.stringify(dataReport, undefined, 2));

    if (!this.wxDataReport) {
      this.wxDataReport = dataReport;
      this.wxRegisterAccessories(dataReport);
    } else {
      this.wxDataReport = dataReport;
    }

    this.wxUpdateAccessories(dataReport);
  }

  addSensorType(add, name) {
    if (add) {
      this.wxStationInfo.sensors.push(name);
    }
  }

  wxRegisterAccessories(dataReport) {
    this.wxStationInfo.model = dataReport.model;
    this.wxStationInfo.softwareRevision = dataReport.stationtype;
    this.wxStationInfo.frequency = dataReport.freq;

    this.addSensorType(dataReport['wh25batt'] !== undefined, 'WH25');
    this.addSensorType(dataReport['wh65batt'] !== undefined, 'WH65');
    this.addSensorType(dataReport['wh57batt'] !== undefined, 'WH57');

    this.log.info('WX Station:', JSON.stringify(this.wxStationInfo, undefined, 2));

    for (const sensor of this.wxStationInfo.sensors) {
      const sensorId = this.config.mac + '_' + sensor;
      const uuid = this.api.hap.uuid.generate(sensorId);

      this.log.info('Sensor:', sensor, sensorId, 'uuid:', uuid);

      const sensorInfo = SensorInfos[sensor];

      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        //new EcowittPlatformAccessory(this, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        //} else {
      }
      {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', sensor);

        // create a new accessory
        const accessory = new this.api.platformAccessory(sensorInfo.name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.sensorInfo = sensorInfo;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        //new EcowittPlatformAccessory(this, accessory);

        let instance;

        switch (sensor) {
          case 'WH25':
            instance = new WH25(this, accessory);
            break;

          case 'WH65':
            instance = new WH65(this, accessory);
            break;

          case 'WH57':
            instance = new WH57(this, accessory);
            break;

          default:
            instance = new EcowittPlatformAccessory(this, accessory);
            break;
        }

        this.wxStationInfo.sensorInstances[sensor] = instance;

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  wxUpdateAccessories(dataReport) {
    const dateUTC = new Date(dataReport.dateutc);
    this.log.info('Report time:', dateUTC);

    for (const sensor of this.wxStationInfo.sensors) {
      const instance = this.wxStationInfo.sensorInstances[sensor];

      this.log.info('Updating:', sensor, !!instance);
      instance.update(dataReport);
    }
  }
}
