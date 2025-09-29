// 'use strict'

// class EventBus {
//   eventsMap

//   constructor() {
//     this.eventsMap = []
//   }

//   registerForEvent(in_class, in_event_name) {
//     // console.log(in_event_name);
//     if (this.eventsMap[in_event_name] == undefined) {
//       // console.log("undefined");
//       this.eventsMap[in_event_name] = []
//     }
//     if (!this.eventsMap[in_event_name].includes(in_class)) {
//       this.eventsMap[in_event_name].push(in_class)
//     }
//     // console.log(in_class+"registered for event "+in_event_name);
//     //		console.log("Classes registered: "+this.#eventsMap[in_event_name]);
//     this.printEventBusStatus()
//   }

//   printEventBusStatus() {
//     for (var eventName in this.eventsMap) {
//       for (var i = 0; i < this.eventsMap[eventName].length; i++) {
//         // console.log(eventName+"->"+this.eventsMap[eventName][i].name);
//       }
//     }
//   }

//   fireEvent(in_event) {
//     // console.log(JSON.stringify(in_event));
//     let eventName = in_event.name
//     // console.log("FIRE EVENT "+eventName);

//     this.printEventBusStatus()

//     if (this.eventsMap[eventName] !== undefined) {
//       for (var i = 0; i < this.eventsMap[eventName].length; i++) {
//         let claz = this.eventsMap[eventName][i]
//         // console.log("NOTIFY "+claz.name);
//         claz.notify(in_event)
//       }
//     } else {
//       // console.log("No classes registered for the event "+in_event.name);
//     }
//   }
// }

// var eventBus = new EventBus()

// export default eventBus
