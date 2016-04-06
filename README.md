# sob
simple observable or something like that

##advisory
i am not entirely sure if my naming of streams or observables is even proper to what it is supposed to mean

##ok so what is this
this is beginning of minimalistic library working on streams, similar to rxjs


##k so how do i even
for now you can create a streams with: fromDomEvent(node, eventName), fromInterval(miliseconds),  fromInterval(miliseconds)


if you are crazy enough, you can also create own streams with Sob(run, dispose) constructor;

```
//!!!! not that i tested it yet

otherStream.map(function(x){
	return new Sob(
		function(onNext){
			var xhr = new XMLHttpRequest();
			xhr.open('GET', 'someurl')
			xhr.addEventListener('load', onNext, false);
	      xhr.send();
		},
		function(){
			//actually im not entirely sure yet what how woudl you cancel this
		}
	)
}).flatMap(function(xhrData){return xhrData}).sub(function(data){
	console.log('deliucious xhr data', data)
})

```


your event nor interval does nt start until you call stream.sub(function), after you do, each incomming item will call your function


stream.map(fn) returns new stream connected to current stream, each value is mdified by fn(value)


stream.flatMap(fn) subscribes to each received item and returns fn(value) each time one of inner streams returns value


stream.zip(otherStream, fn) calls fn(x,y) with items from each stream, if one stream has no items, execution waits for its arrival, effectively returning stream composed of both streams


stream.dispose() kills the cat, i mean, stream.


stream.first() dies after first item returned


#boring, anything cool there?
i thought its cool already, begone and wait for me to update this
