FROM public.ecr.aws/lambda/python:3.10

# Copy your local `openai_layer` to the container
COPY openai_layer /opt/python

# Package the dependencies into a zip file
WORKDIR /opt
RUN zip -r layer.zip python


