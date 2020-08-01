# Speck

An attempt to bring together a message processing stack with IoT sensor managment.   


[![npm Version](https://img.shields.io/npm/v/@johntalton/speck.svg)](https://www.npmjs.com/package/@johntalton/speck)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/speck)
![CI](https://github.com/johntalton/speck/workflows/CI/badge.svg?branch=master&event=push)
![CodeQL](https://github.com/johntalton/speck/workflows/CodeQL/badge.svg)
![GitHub](https://img.shields.io/github/license/johntalton/speck)
[![Downloads Per Month](https://img.shields.io/npm/dm/@johntalton/speck.svg)](https://www.npmjs.com/package/@johntalton/speck)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/speck)
[![Package Quality](https://npm.packagequality.com/shield/%40johntalton%2Fspeck.svg)](https://packagequality.com/#?package=@johntalton/speck)


## Design
The core bring together three branches of development:
* sensor firmware (hardware)
* life-cycle orchestration
* messaging

The first two stem one from the other, by the virtue that developing multiple firmware code bases, the needs to create a uniform interfaces and vocabulary arose.  This can be seen in the many sensor `example/client.js` files found thoughout each.  This orchestration follows a state machine pattern and facilitates Up / Down and Injection logic.  

Secondly, messaging becomes the backbone of most reporting systems.  The need to create namespaces and encapsulation within the message processing space requires a service.  This service is realized as a general binding language for topics to processing scripts (a node process that can load js and execute it on incoming message).

Last, two other fundamental forces apply.  One is the use of containers (docker). And two is arbitrary constraints of the projects chosen technologies (for example: I²C devices must share a bus which must be managed in complex depolyments.  Thus, deployment of two containored deveice implementations need a channel by which to facilitate that, or consider co-deployment and break some pure-design issolation)

## Hardware
The sensor set choosen provies a uniform architecture and resulting api.  Each devices can be though of in three layrs: 
- functional static bus-level api (buffers & bits)
- functional static device api (human readable format)
- class based api to encasulate parameters and provide mix-ability

I²C Bus centric parts:
Part|Descriptions|
|:--|--:|
|[AOD]()|Static library of Bit-level and Bus-level conveniences.
|[ADS1115]()|
|[AM2320]()|Temperature sensor
|[Bosch IEU]()|Integrated Environment Unit (Temperature / Humidity / Pressure / Gas)
|[DS3502]()|
|[INA219]()|High Side Current / Power sensor
|[MB85]()|FRAM Memory chip
|[MCP23xxx]()|GPIO controler
|[MCP300x]()|
|[MCP4725]()|
|[MCP9808]()|
|[TCA9548A]()|An I²C Bus managment
|[TCS34725]()|Light sensor
|[]()|

Other non-bus based work:
Circuit|Descriptions|
|:--|--:|
|[Rotary Encoder]()|Classic Knob
|[1-bit ADC]()|ADC from Resistor / Capacitor


## Lifecycle managment

Hardware has many asycronous features that need to be managed. The primary feature is to decouple
the initialization and the ability it has to `provide` a service (such as Gpio factory).

Few restriction are intended for the provides capability and preference on when, how many or if 
to revoke any type of provided functionality.

This added layer, while added complexity vs a standard all-up sytle script approche, allows for 
the use of multiplexer-i2c devices / external gpio extention and other dynamic setup that would
otherwise reuquire specific all-up code to manage for each depolyment senario.

This also provides usefull restart and recovery in docker / swarm deployments.


## Messaging
Messaging provides the backbone for application development.  

|Services|Description|
|:--|--:|
|[GPSD to MQTT]()|Extention of the `gpsd` to to publish to an MQTT topic
|[MQTT to MQTT]()|A proxy for MQTT with topic to function to topic bindings




## So... what about
Microsoft Azure, Google cloud functions, AWS Lambdas, Cloudflare, GitHub Actions, etc ...

- project goal include air-gapped implementations for unique deployment
- moving processing close to edge
- extends into the browser runtime
- end-to-end vision allows for strong bias api (potentially creating simpler more limited system)







