# Speck

Johnny Five may have been alive, but it was Stephenie Speck that taugh him to have hart!


[![npm Version](https://img.shields.io/npm/v/@johntalton/speck.svg)](https://www.npmjs.com/package/@johntalton/speck)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/speck)
![CI](https://github.com/johntalton/speck/workflows/CI/badge.svg?branch=master&event=push)
![CodeQL](https://github.com/johntalton/speck/workflows/CodeQL/badge.svg)
![GitHub](https://img.shields.io/github/license/johntalton/speck)
[![Downloads Per Month](https://img.shields.io/npm/dm/@johntalton/speck.svg)](https://www.npmjs.com/package/@johntalton/speck)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/speck)
[![Package Quality](https://npm.packagequality.com/shield/%40johntalton%2Fspeck.svg)](https://packagequality.com/#?package=@johntalton/speck)


## Motivation

An amalgimation of several other examples found other `@johntalton` libraries.  While each of
those were developed to be consumed in isolation this is to provide an example of integration
between many of them and other 3rd party libraries.

## Lifecycle managment

Hardware has many asycronous features that need to be managed. The primary feature is to decouple
the initialization and the ability it has to `provide` a service (such as Gpio factory).

Few restriction are intended for the provides capability and preference on when, how many or if 
to revoke any type of provided functionality.

This added layer, while added complexity vs a standard all-up sytle script approche, allows for 
the use of multiplexer-i2c devices / external gpio extention and other dynamic setup that would
otherwise reuquire specific all-up code to manage for each depolyment senario.

This also provides usefull restart and recovery in docker / swarm deployments.


