FROM public.ecr.aws/lambda/python:3.10

# Install zip utility
RUN yum install -y zip unzip

# Copy the dependencies into the layer
COPY openai_layer /opt/python

# Package the dependencies into a zip file
WORKDIR /opt
RUN zip -r layer.zip python

# Copy the zip file to an accessible directory
RUN mkdir /mnt/output
RUN cp layer.zip /mnt/output
