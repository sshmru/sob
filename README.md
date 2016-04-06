# sob
simple observable or something like that

##advisory
i am not entirely sure if my naming of streams or observables is even proper to what it is supposed to mean

##ok so what is this
this is beginning of minimalistic library working on streams, similar to rxjs


##k so how do i even
for now you can create a streams with: fromDomEvent(node, eventName), fromInterval(miliseconds),  fromInterval(miliseconds), fromArray(array)


if you are crazy enough, you can also create own streams with Sob(run, dispose) constructor;

```
//!!!! not that i tested it yet
Sob.fromArray(['url1', 'url2']) //get list of urls
   .map(function(url){ //for each url
		return new Sob( //sob
			function(onNext){
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url) // that calls url
				xhr.addEventListener('load', onNext, false);  //and calls onNext on response
		      xhr.send();
			},
			function(){
				//actually im not entirely sure yet what how woudl you cancel this
			}
		)
	})
   .flatMap(function(xhrData){return xhrData}) // flatten to responses
	.sub(function(data){
		console.log('deliucious xhr data', data) // dance
	})

```


your event nor interval does nt start until you call stream.sub(function), after you do, each incomming item will call your function


stream.map(fn) returns new stream connected to current stream, each value is mdified by fn(value)


stream.filter(fn) returns new stream of values of items passing condition


stream.reduce(fn, acc) returns stream of accumulator values modified by incomming items


stream.flatMap(fn) subscribes to each received item and returns fn(value) each time one of inner streams returns value


stream.zip(otherStream, fn) calls fn(x,y) with items from each stream, if one stream has no items, execution waits for its arrival, effectively returning stream composed of both streams


stream.merge(otherStream) return stream of latest values given by one of given streams


stream.dispose() kills the cat, i mean, stream.


stream.first() dies after first item returned


stream.delay(time) returns stream of delayed data, keep in mind disposing it does not prevent currently delayed items from being passed forward(might change)


stream.buffer(size) returns stream of streams made of latest 5 values emitted by source stream(need to flatmap this later on to get its values)


#boring, anything cool there?
i thought its cool already, begone and wait for me to update this
