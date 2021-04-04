import { PlatformAccessory } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';
import { ThermoHygroBaroSensor } from './ThermoHygroBaroSensor';


export class GW1000 extends ThermoHygroBaroSensor {

  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);

    this.setModel(platform.baseStationInfo.model);
    this.setProductData(this.platform.baseStationInfo.productData);

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Name, this.platform.baseStationInfo.name);
    // .setCharacteristic(this.platform.Characteristic.ConfiguredName, accessory.context.sensorInfo.displayName)
    //  .setCharacteristic(this.platform.Characteristic.SerialNumber, platform.baseStationInfo.serialNumber);
    // .setCharacteristic(this.platform.Characteristic.HardwareRevision, platform.baseStationInfo.hardwareRevision)
    // .setCharacteristic(this.platform.Characteristic.SoftwareRevision, platform.baseStationInfo.softwareRevision)
    // .setCharacteristic(this.platform.Characteristic.FirmwareRevision, platform.baseStationInfo.firmwareRevision);
  }

  update(dataReport) {
    this.platform.log.info('GW1000 Update');
    this.platform.log.info('  tempinf:', dataReport.tempinf);
    this.platform.log.info('  humidityin:', dataReport.humidityin);
    this.platform.log.info('  baromrelin', dataReport.baromrelin);
    this.platform.log.info('  baromabsin', dataReport.baromabsin);

    this.updateTemperature(dataReport.tempinf);
    this.updateHumidity(dataReport.humidityin);
    this.updateAbsolutePressure(dataReport.baromabsin);
    this.updateRelativePressure(dataReport.baromrelin);
  }
}

