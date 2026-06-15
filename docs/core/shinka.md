# Shinka

::: details What does `shinka` mean?
The name **Shinka** is a wordplay on the concept of a message **bus**.

In several Slavic languages, the term *bus* (as in *message bus* or *data bus*) is translated as **"shina"** (шина), literally meaning a data bus. **Shinka** (шинка) is the diminutive form of *shina*, which could be loosely translated as "little bus".

At the same time, *shinka* is also a word for a type of ham or cured meat in several languages, including Ukrainian, Belarusian, Polish, and even German (*Schinken*). The result is a deliberately playful name that references both messaging infrastructure and an unexpected culinary coincidence.
:::

# And where is this `shinka`?

```mermaid
flowchart TB
  subgraph BUS ["Bus"]
    subgraph U ["User shinka"]
      subgraph UDO ["ShinkaDo"]
        direction RL
        UREQ(["request"]):::request
        UEVT(["dataEvent"]):::dataEvent
      end
      subgraph UON ["ShinkaOn"]
        direction RL
        UONR(["onRequest"]):::onRequest
        UONE(["onDataEvent"]):::onDataEvent
      end
    end
    subgraph B ["Bus shinka"]
      subgraph BDO ["ShinkaDo"]
        direction RL
      BREQ(["request"]):::request
      BEVT(["dataEvent"]):::dataEvent
      end
      subgraph BON ["ShinkaOn"]
        direction RL
      BONR(["onRequest"]):::onRequest
      BONE(["onDataEvent"]):::onDataEvent
      end
    end
    subgraph S ["Serializer shinka"]
      subgraph SDO ["ShinkaDo"]
        direction RL
        SREQ(["request"]):::request
        SEVT(["dataEvent"]):::dataEvent
      end
      subgraph SON ["ShinkaOn"]
        direction RL
        SONR(["onRequest"]):::onRequest
        SONE(["onDataEvent"]):::onDataEvent
      end
    end
    subgraph T ["Transport shinka"]
      subgraph TDO ["ShinkaDo"]
        direction RL
        TREQ(["request"]):::request
        TEVT(["dataEvent"]):::dataEvent
      end
      subgraph TON ["ShinkaOn"]
        direction RL
        TONR(["onRequest"]):::onRequest
        TONE(["onDataEvent"]):::onDataEvent
      end
    end
  end

  classDef request stroke:#666
  classDef dataEvent stroke:#00f
  classDef onRequest stroke:#0f0
  classDef onDataEvent stroke:#f00
```

There are 4 (!) independent `shinka`s under the bus hood: own for transport,
serializer, bus and user. Your application defined `onRequest` / `onDataEvent`
handlers and `request` / `dataEvent` methods are just `user shinka`. 

::: tip BUT
All 4 `shinka`s are handled by single connection
:::

# So, what is `Shinka`?

It's independent communication channel:
- `ShinkaOn`: own `onRequest` and `onDataEvent` handlers
- `ShinkaDo`: own `request` and `dataEvent` senders

# What does this actually mean?

This allow building complex and powerful transports and serializers. For
example, serializer may ask interlocutor to change encryption key. One of them,
`bus shinka`, is used to handle `ping` request and 3 internal events
