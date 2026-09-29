package com.manacommunity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDto implements Serializable {
    private List<StatItem> stats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatItem implements Serializable {
        private String label;
        private String value;
    }
}
