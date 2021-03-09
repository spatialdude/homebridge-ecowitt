import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { EcowittHomebridgePlatform } from './platform';


export class EcowittPlatformAccessory {

  constructor(
    protected readonly platform: EcowittHomebridgePlatform,
    protected readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, platform.wxStationInfo.manufacturer)
      .setCharacteristic(this.platform.Characteristic.ProductData, platform.wxStationInfo.frequency)
      .setCharacteristic(this.platform.Characteristic.Model, platform.wxStationInfo.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, platform.wxStationInfo.serialNumber)
      .setCharacteristic(this.platform.Characteristic.HardwareRevision, platform.wxStationInfo.model)
      .setCharacteristic(this.platform.Characteristic.SoftwareRevision, platform.wxStationInfo.softwareRevision);
  }

  addBattery(name: string) {
    const battery = this.accessory.getService(this.platform.Service.Battery)
      || this.accessory.addService(this.platform.Service.Battery);

    battery.setCharacteristic(
      this.platform.Characteristic.Name,
      name || (this.accessory.context.sensorInfo.name + ' Battery'));

    battery.setCharacteristic(
      this.platform.Characteristic.ChargingState,
      this.platform.Characteristic.ChargingState.NOT_CHARGEABLE);

    battery.setCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);

    return battery;
  }

  toCelcius(fahrenheit: any): number {
    return (parseFloat(fahrenheit) - 32) * 5 / 9;
  }

  tohPa(inHg: any): number {
    return parseFloat(inHg) * 33.8638;
  }
}


