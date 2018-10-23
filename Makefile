build:
	docker build -t dgg . 
test:	build
	docker run -it --rm --entrypoint npm --name dgg dgg test
run: build
	docker run -it --rm --name dgg dgg


.PHONY: test build run