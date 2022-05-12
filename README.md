Web RTC Full course [link](https://www.youtube.com/watch?v=QsH8FL0952k)

WebRTC allow us to establish peer to peer connection between 2 browsers to exchange data such as audio and video in real time.

-> REAL TIME Communication
-> Lower Latency

Websocket Real Time Communication through server

WebRTC: Client <- -> Client

WebSocket Client <- -> Server <- -> Client (little bit of latency for audio and video)

WebRTC use UDP as transport protocol, UDP is FAST, UDP does not validate data.
UDP is not reliable protocol for transferring important data
NO built in signaling, it us that need to make initial connection, once connection is made then
WebRTC takes over

    WebSockets + WebRTC = 👍
