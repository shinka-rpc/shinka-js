# Shinka

::: tip
The name **Shinka** is a wordplay on the concept of a message **bus**.

In several Slavic languages, the term *bus* (as in *message bus* or *data bus*) is translated as **"shina"** (шина), literally meaning a data bus. **Shinka** (шинка) is the diminutive form of *shina*, which could be loosely translated as "little bus".

At the same time, *shinka* is also a word for a type of ham or cured meat in several languages, including Ukrainian, Belarusian, Polish, and even German (*Schinken*). The result is a deliberately playful name that references both messaging infrastructure and an unexpected culinary coincidence.
:::

![diagram](../img/bus-shinka.svg "Structure of `@shinka-rpc`")

# So, what is `Shinka`?

It's independent communication channel:
- own request and event handlers
- own request and event senders

# What does this actually mean?

This allow building complex and powerful transports and serializers. For
example, serializer may ask interlocutor to change encryption key. One of them,
`bus shinka`, is used to handle `ping` request and 3 internal events
