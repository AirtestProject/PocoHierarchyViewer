
import _ from 'lodash'

export class AdbDevices {
    constructor(adbClient) {
        this.devices = {}
        this.adbClient = adbClient

        setTimeout(this.startDeviceTracking.bind(this), 1000)
        this.adbClient.listDevices()
            .then(devs => {
                Promise.all(_.map(devs, dev => {
                    return this.adbClient.getProperties(dev.id)
                        .then(properties => {
                            let model = properties['ro.product.model']
                            let manufacture = properties['ro.product.manufacturer']
                            return [dev, model || manufacturer]
                        })
                }))
                .then(devModels => {
                    let devices = {}
                    for (let devmodel of devModels) {
                        let [dev, model] = devmodel
                        devices[dev.id] = Object.assign({model}, dev)
                    }
                    return devices
                })
                .then(devices => {
                    this.devices = devices
                    this.onDevicesChanged(this.devices)
                })
            })
    }

    startDeviceTracking() {
        this.adbClient.trackDevices()
            .then(tracker => {
                tracker.on('add', device => {
                    this.adbClient.getProperties(device.id)
                        .then(properties => {
                            let model = properties['ro.product.model']
                            let manufacture = properties['ro.product.manufacturer']
                            return model || manufacturer
                        })
                        .then(model => {
                            let deviceinfo = this.devices[device.id] || {}
                            deviceinfo.model = model
                            this.devices[device.id] = deviceinfo
                            this.onDevicesChanged(this.devices)
                        })
                })
                tracker.on('remove', device => {
                    delete this.devices[device.id]
                    this.onDevicesChanged(this.devices)
                })
                tracker.on('end', () => {
                    setTimeout(this.startDeviceTracking.bind(this), 1000)
                })
            })
            .catch(err => {
                console.error('Something went wrong:', err.stack)
            })
    }

    onDevicesChanged(devices) {

    }
}
