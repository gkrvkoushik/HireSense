package com.backend.controllers;

import com.backend.entities.Response;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;




@RestController
public class HomeController {

    @GetMapping("/api/status")
    public Response<String> home(){
        return Response.<String>builder().message("API is working").statusCode(200).data("Server is running....").build();
    }


}
