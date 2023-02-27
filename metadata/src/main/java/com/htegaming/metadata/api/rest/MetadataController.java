package com.htegaming.metadata.api.rest;

import com.htegaming.metadata.service.MetadataService;
import com.netflix.dgs.codegen.generated.types.Blockchain;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/blockchains/")
@RequiredArgsConstructor
public class MetadataController {

    private final MetadataService service;

    @GetMapping("metadata")
    public List<Blockchain> allBlockchains() {
        return service.getMetadata();
    }

    @GetMapping("{blockchainCode}/metadata")
    public ResponseEntity<Blockchain> singleBlockchain(@PathVariable String blockchainCode) {
        return service.getMetadata(blockchainCode)
                .map(m -> new ResponseEntity<>(m, HttpStatus.NOT_FOUND))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

}
