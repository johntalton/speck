# Speck

Johnny Five may have been alive, but it was Stephenie Speck that taugh him to have hart!

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


