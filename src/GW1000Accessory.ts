import { PlatformAccessory } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';
import { THBAccessory } from './THBAccessory';


export class GW1000Accessory extends THBAccessory {

  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    super(platform, accessory);
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
    this.updateRelativePressue(dataReport.baromrelin);
  }
}

