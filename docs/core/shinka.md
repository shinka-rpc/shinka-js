# Shinka

::: details What does `shinka` mean?
The name **Shinka** is a wordplay on the concept of a message **bus**.

In several Slavic languages, the term *bus* (as in *message bus* or *data bus*)
is translated as **"shina"** (шина), literally meaning a data bus. **Shinka**
(шинка) is the diminutive form of *shina*, which could be loosely translated as
"little bus".

At the same time, *shinka* is also a word for a type of ham or cured meat in
several languages, including Ukrainian, Belarusian, Polish, and even German
(*Schinken*). The result is a deliberately playful name that references both
messaging infrastructure and an unexpected culinary coincidence.
:::

# And where is this `shinka`?

Short answer: under `Bus` hood. And it's not single:

![diagram](../img/bus-shinka.svg "And where is this `shinka`?")

There are ***6*** independent `shinka`s under the bus hood: own for _user_,
_bus_, special _non-blocking_ shinka (serving [ExclusiveLock](../other/exclusive-lock.md)),
_transport_, _serializer_,  and optionally _limon_. Your application defined `onRequest` /
`onDataEvent` handlers and `request` / `dataEvent` methods are just `user shinka`

::: tip BUT
All 6 `shinka`s are handled by single connection. They are dispatched via
internal leading `MessageType` field
:::

::: details Literally:
```typescript
export const enum MessageType {
  // USER
  USER_REQUEST = 0,
  USER_SUCCESS = 1,
  USER_ERROR = 2,
  USER_EVENT = 3,
  // BUS
  BUS_REQUEST = 4,
  BUS_SUCCESS = 5,
  BUS_ERROR = 6,
  BUS_EVENT = 7,
  // NON_BLOCKING
  NB_REQUEST = 8,
  NB_SUCCESS = 9,
  NB_ERROR = 10,
  NB_EVENT = 11,
  // TRANSPORT
  TRANSPORT_REQUEST = 12,
  TRANSPORT_SUCCESS = 13,
  TRANSPORT_ERROR = 14,
  TRANSPORT_EVENT = 15,
  // SERIALIZER
  SERIALIZER_REQUEST = 16,
  SERIALIZER_SUCCESS = 17,
  SERIALIZER_ERROR = 18,
  SERIALIZER_EVENT = 19,
  // LIMON
  LIMON_REQUEST = 20,
  LIMON_SUCCESS = 21,
  LIMON_ERROR = 22,
  LIMON_EVENT = 23,
}
```
:::

# So, what is `Shinka`?

It's independent communication channel:
- `ShinkaOn`: own `onRequest` and `onDataEvent` handler registries
- `ShinkaDo`: own `request` and `dataEvent` senders

# Why?

This allow building complex and powerful transports and serializers. For
example, serializer may ask interlocutor to change encryption key. One of them,
`bus shinka`, is used to handle `ping` request and 3 internal events
