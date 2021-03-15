import { PlatformAccessory, /*CharacteristicValue,*/ Service } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';

export class EcowittAccessory {

  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {

    this.platform.log.info('info:', JSON.stringify(this.accessory.context.sensorInfo, undefined, 2));

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, platform.wxStationInfo.manufacturer)
      .setCharacteristic(this.platform.Characteristic.ProductData, platform.wxStationInfo.frequency)
      .setCharacteristic(this.platform.Characteristic.Name, accessory.context.sensorInfo.displayName)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, accessory.context.sensorInfo.displayName)
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.sensorInfo.name)//platform.wxStationInfo.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, platform.wxStationInfo.serialNumber)
      .setCharacteristic(this.platform.Characteristic.HardwareRevision, platform.wxStationInfo.model)
      .setCharacteristic(this.platform.Characteristic.SoftwareRevision, platform.wxStationInfo.softwareRevision);
  }

  //---------------------------------------------------------------------------

  update(dataReport) {
    this.platform.log.error('Update not implemented:', dataReport);
  }

  //---------------------------------------------------------------------------

  setName(service: Service, name: string) {
    service.setCharacteristic(
      this.platform.Characteristic.Name,
      name);
  }

  updateName(service: Service, name: string) {
    service.updateCharacteristic(
      this.platform.Characteristic.Name,
      name);
  }

  //---------------------------------------------------------------------------

  private serviceUuid(name: string) {
    const serviceId = this.platform.config.mac + '_' + name;
    return this.platform.api.hap.uuid.generate(serviceId);
  }

  //---------------------------------------------------------------------------

  setStatusActive(service: Service, active: boolean) {
    service.setCharacteristic(
      this.platform.Characteristic.StatusActive,
      active);
  }

  updateStatusActive(service: Service, active: boolean) {
    service.updateCharacteristic(
      this.platform.Characteristic.StatusActive,
      active);
  }

  //---------------------------------------------------------------------------

  addOccupancySensor(name: string) {
    const occupancySensor = this.accessory.getService(name) ||
      this.accessory.addService(
        this.platform.Service.OccupancySensor,
        name,
        this.serviceUuid(name));

    return occupancySensor;
  }

  updateOccupancyDetected(service: Service, occupancyDetected: boolean) {
    service.updateCharacteristic(
      this.platform.Characteristic.OccupancyDetected,
      occupancyDetected
        ? this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED
        : this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
  }

  //---------------------------------------------------------------------------

  addMotionSensor(name: string) {
    const motionSensor = this.accessory.getService(name) ||
      this.accessory.addService(
        this.platform.Service.MotionSensor,
        name,
        this.serviceUuid(name));

    return motionSensor;
  }

  updateMotionDetected(service: Service, motionDetected: boolean) {
    service.updateCharacteristic(
      this.platform.Characteristic.MotionDetected,
      motionDetected);
  }

  //---------------------------------------------------------------------------

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

  updateBatteryLevel(service: Service, batteryLevel: number) {
    service.updateCharacteristic(
      this.platform.Characteristic.BatteryLevel,
      batteryLevel);
  }

  //---------------------------------------------------------------------------

  updateStatusLowBattery(service: Service, lowBattery: boolean) {
    service.updateCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      lowBattery
        ? this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
        : this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
  }

  //---------------------------------------------------------------------------

  updateCurrentTemperature(service: Service, tempf) {
    service.updateCharacteristic(
      this.platform.Characteristic.CurrentTemperature,
      this.toCelcius(tempf));
  }

  toCelcius(fahrenheit): number {
    return (parseFloat(fahrenheit) - 32) * 5 / 9;
  }

  //---------------------------------------------------------------------------

  updateCurrentRelativeHumidity(service: Service, humidity) {
    service.updateCharacteristic(
      this.platform.Characteristic.CurrentRelativeHumidity,
      parseFloat(humidity));
  }

  tohPa(inHg): number {
    return parseFloat(inHg) * 33.8638;
  }

  //---------------------------------------------------------------------------
}


